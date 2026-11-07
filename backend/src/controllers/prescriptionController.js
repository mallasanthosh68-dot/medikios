const {
  Prescription,
  DoctorProfile,
  PatientProfile,
  User,
  DoctorRequest,
  MedicalTimeline,
  HealthSummary,
  Notification,
} = require('../models');

// @route   POST /api/prescriptions
// Doctor generates a digital prescription and prints it directly to their system
const createPrescription = async (req, res, next) => {
  try {
    const {
      patientId,
      opNumber,
      abhaId,
      requestId,
      patientName,
      patientAge,
      patientGender,
      patientPhone,
      medicines,
      instructions = 'Take medications as directed with plenty of water.',
      doctorNotes = '',
      followUpDays = 7,
      diagnosisOrImpression = 'Clinical Evaluation',
    } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one medicine entry is required.',
      });
    }

    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });

    // Resolve patient details (handles registered patients, OP lookups, and walk-ins)
    let resolvedPatientName = (patientName || '').trim() || 'Walk-in Patient';
    let resolvedPatientAge = parseInt(patientAge, 10) || 35;
    let resolvedPatientGender = patientGender || 'Not specified';
    let resolvedPatientPhone = patientPhone || '—';
    let validPatientId = null;

    if (patientId && patientId !== 'patient-walkin' && patientId !== 'patient-op-direct') {
      const patientUser = await User.findById(patientId).catch(() => null);
      const patientProfile = await PatientProfile.findOne({ userId: patientId }).catch(() => null);
      if (patientUser) {
        validPatientId = patientUser._id || patientId;
        resolvedPatientName = patientUser.name || resolvedPatientName;
        resolvedPatientPhone = patientUser.phoneNumber || resolvedPatientPhone;
        resolvedPatientAge = patientProfile?.age || resolvedPatientAge;
        resolvedPatientGender = patientProfile?.gender || resolvedPatientGender;
      }
    }

    // OP Number is completely optional — no verification lock or enforcement
    const cleanEnteredOp = (opNumber || '').trim().toUpperCase();

    const prescription = await Prescription.create({
      doctorId: req.user.id,
      patientId: validPatientId,
      opNumber: cleanEnteredOp,
      abhaId: (abhaId || '').trim(),
      requestId: requestId || null,
      doctorName: doctorProfile?.doctorName || req.user.name,
      doctorLicense: doctorProfile?.licenseNumber || 'MCI-REG-89104',
      doctorSpecialty: doctorProfile?.specialization || 'General Medicine',
      hospitalName: doctorProfile?.hospitalAffiliation || 'MediKiosk Apex Hospital',
      patientName: resolvedPatientName,
      patientAge: resolvedPatientAge,
      patientGender: resolvedPatientGender,
      patientPhone: resolvedPatientPhone,
      diagnosisOrImpression,
      medicines: medicines.map((m) => ({
        name: m.name,
        genericName: m.genericName || '',
        strength: m.strength || '',
        form: m.form || 'Tablet',
        dosage: m.dosage || '1 unit',
        frequency: m.frequency || 'Twice daily',
        timing: {
          morning: Boolean(m.timing?.morning),
          afternoon: Boolean(m.timing?.afternoon),
          night: Boolean(m.timing?.night),
          mealRelation: m.timing?.mealRelation || 'After food',
        },
        duration: m.duration || '5 days',
        instructions: m.instructions || '',
      })),
      generalInstructions: instructions,
      doctorNotes,
      followUpDays: parseInt(followUpDays, 10) || 7,
      status: 'ISSUED',
      printedByDoctor: true,
      sentToPatient: false,
    });

    // Update Request status if linked to doctor review request
    if (requestId) {
      const linkedReq = await DoctorRequest.findByIdAndUpdate(
        requestId,
        { $set: { status: 'PRESCRIPTION_ISSUED' } },
        { new: true }
      ).catch(() => null);

      if (linkedReq?.summaryId) {
        const { HealthSummary } = require('../models');
        await HealthSummary.findByIdAndUpdate(linkedReq.summaryId, {
          $set: { status: 'COMPLETED' },
        }).catch(() => null);
      }
    }

    // NOTE: Per requirement, the medicines/prescription are NOT sent to the patient.
    // No notification is dispatched to the patient portal.
    // The prescription is generated for the doctor to print to his system.

    res.status(201).json({
      success: true,
      prescription,
      message: 'Prescription generated successfully. Ready to print to your system.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/prescriptions
const getPrescriptions = async (req, res, next) => {
  try {
    // If patient, medicines are not sent to patient portal per clinical policy
    if (req.user.role === 'patient') {
      return res.json({ success: true, prescriptions: [] });
    }

    let query = {};
    if (req.user.role === 'doctor') {
      query.doctorId = req.user.id;
    }

    const prescriptions = await Prescription.find(query);
    res.json({ success: true, prescriptions });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/prescriptions/:id
const getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found.' });
    }

    // Role check: Only the prescribing doctor or the patient can access this prescription
    if (
      String(prescription.patientId) !== String(req.user.id) &&
      String(prescription.doctorId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. You do not have permission to view this prescription.',
      });
    }

    // Generate patient-friendly visual schedule
    const schedule = prescription.medicines.map((med) => ({
      name: med.name,
      form: med.form,
      strength: med.strength,
      morning: med.timing?.morning ? '✓' : '—',
      afternoon: med.timing?.afternoon ? '✓' : '—',
      night: med.timing?.night ? '✓' : '—',
      mealRelation: med.timing?.mealRelation || 'After food',
      duration: med.duration,
      instructions: med.instructions,
    }));

    res.json({
      success: true,
      prescription,
      patientSchedule: schedule,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
};
