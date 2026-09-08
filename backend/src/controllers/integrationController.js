const abdmService = require('../services/abdmService');
const hisService = require('../services/hisService');
const { generateFhirBundle } = require('../services/fhirService');
const {
  User,
  PatientProfile,
  DoctorProfile,
  HealthSummary,
  Prescription,
  MedicalExtraction,
} = require('../models');

// ABDM status check
const getAbdmStatus = (req, res) => {
  res.json({
    success: true,
    ...abdmService.getSystemStatus(),
  });
};

// ABDM Connect (Simulate M1 ABHA address linking)
const connectAbdm = async (req, res, next) => {
  try {
    const { abhaNumber, demoOtp } = req.body;
    const result = await abdmService.verifyAbhaDemo({ abhaNumber, demoOtp });

    if (!result.success) {
      return res.status(400).json(result);
    }

    if (req.user) {
      await PatientProfile.findOneAndUpdate(
        { userId: req.user.id },
        {
          $set: {
            aadhaarDemoVerified: true,
            aadhaarDemoId: result.abhaNumber,
          },
        }
      );
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ABDM Share Health Records (Simulate M2)
const shareAbdmRecords = async (req, res, next) => {
  try {
    const { recordType, bundleId = 'bundle-demo-001' } = req.body;
    const result = await abdmService.shareHealthRecordDemo({ bundleId, recordType });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// FHIR Interoperability Bundle Generator
const getFhirBundle = async (req, res, next) => {
  try {
    const patientId = req.params.patientId || req.user?.id;
    const [patientUser, patientProfile, summary, prescription, extraction] = await Promise.all([
      User.findById(patientId),
      PatientProfile.findOne({ userId: patientId }),
      HealthSummary.findOne({ patientId }),
      Prescription.findOne({ patientId }),
      MedicalExtraction.findOne({ patientId }),
    ]);

    const patientObj = {
      _id: patientUser?._id,
      name: patientUser?.name || 'Demo Patient',
      phoneNumber: patientUser?.phoneNumber || '9876543210',
      age: patientProfile?.age || 35,
      gender: patientProfile?.gender || 'Male',
      aadhaarDemoId: patientProfile?.aadhaarDemoId || '91-DEMO-ABHA-1029',
    };

    const bundle = generateFhirBundle({
      patient: patientObj,
      summary,
      prescription,
      extraction,
    });

    res.json({
      success: true,
      standard: 'HL7 FHIR R4',
      status: 'DEMO_INTEROPERABILITY_EXPORT',
      disclaimer: 'Generated for SIH prototype interoperability demonstration.',
      bundle,
    });
  } catch (error) {
    next(error);
  }
};

// HIS Status & Demo Operations
const getHisStatus = (req, res) => {
  res.json({
    success: true,
    ...hisService.getStatus(),
  });
};

const getHisRecords = async (req, res, next) => {
  try {
    const phone = req.query.phone || req.user?.phoneNumber || '9876543210';
    const records = await hisService.fetchHospitalEmrHistory({ patientPhone: phone });
    res.json(records);
  } catch (error) {
    next(error);
  }
};

const pushHisTriage = async (req, res, next) => {
  try {
    const { suggestedSpecialty, summaryId, priority } = req.body;
    const ticket = await hisService.pushTriageEncounter({
      patientId: req.user?.id,
      patientName: req.user?.name || 'Demo Patient',
      priority: priority || 'NORMAL',
      suggestedSpecialty,
      summaryId,
    });
    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAbdmStatus,
  connectAbdm,
  shareAbdmRecords,
  getFhirBundle,
  getHisStatus,
  getHisRecords,
  pushHisTriage,
};
