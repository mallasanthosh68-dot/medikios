const {
  Prescription,
  DoctorProfile,
  PatientProfile,
  User,
  DoctorRequest,
  MedicalTimeline,
  Notification,
} = require('../models');

// @route   POST /api/prescriptions
// Doctor generates a digital prescription
const createPrescription = async (req, res, next) => {
  try {
    const {
      patientId,
      opNumber,
      requestId,
      medicines,
      instructions = 'Take medications as directed with plenty of water.',
      doctorNotes = '',
      followUpDays = 7,
      diagnosisOrImpression = 'Clinical Evaluation',
    } = req.body;

    if (!patientId || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and at least one medicine entry are required.',
      });
    }

    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    const patientUser = await User.findById(patientId);
    const patientProfile = await PatientProfile.findOne({ userId: patientId });

    if (!patientUser) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Strict OP Number Verification Check
    const cleanEnteredOp = (opNumber || '').trim().toUpperCase();
    const expectedOp = (patientProfile?.opNumber || patientUser?.opNumber || '').trim().toUpperCase();

    if (!cleanEnteredOp) {
      return res.status(403).json({
        success: false,
        message: 'Patient OP Number is required. The doctor must enter the OP Number given by the patient to prescribe medicines and send report.',
      });
    }

    if (!expectedOp || cleanEnteredOp !== expectedOp) {
      return res.status(403).json({
        success: false,
        message: `Invalid Patient OP Number (${opNumber}). Verification failed. You must enter the exact OP Number provided by the patient to issue and send medicines.`,
      });
    }

    const prescription = await Prescription.create({
      doctorId: req.user.id,
      patientId,
      opNumber: expectedOp,
      requestId: requestId || null,
      doctorName: doctorProfile?.doctorName || req.user.name,
      doctorLicense: doctorProfile?.licenseNumber || 'MCI-REG-89104',
      doctorSpecialty: doctorProfile?.specialization || 'General Medicine',
      hospitalName: doctorProfile?.hospitalAffiliation || 'MediKiosk Apex Hospital',
      patientName: patientUser.name,
      patientAge: patientProfile?.age || 35,
      patientGender: patientProfile?.gender || 'Not specified',
      patientPhone: patientUser.phoneNumber,
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
    });

    // Update Request status if linked
    if (requestId) {
      const linkedReq = await DoctorRequest.findByIdAndUpdate(
        requestId,
        { $set: { status: 'PRESCRIPTION_ISSUED' } },
        { new: true }
      );
      if (linkedReq?.summaryId) {
        const { HealthSummary } = require('../models');
        await HealthSummary.findByIdAndUpdate(linkedReq.summaryId, {
          $set: { status: 'COMPLETED' },
        });
      }
    }

    // Add Timeline Event
    const medSummary = medicines.map((m) => `${m.name} (${m.dosage})`).slice(0, 3).join(', ');
    await MedicalTimeline.create({
      patientId,
      eventDate: new Date(),
      year: new Date().getFullYear(),
      eventType: 'PRESCRIPTION',
      title: `Digital Prescription issued by ${doctorProfile?.doctorName || req.user.name}`,
      summary: `Prescribed: ${medSummary}. Diagnosis: ${diagnosisOrImpression}.`,
      doctorOrFacility: `${doctorProfile?.doctorName || req.user.name} (${doctorProfile?.specialization || 'Consultant'})`,
      keyMetrics: [{ label: 'Medicines', value: `${medicines.length} prescribed` }],
    });

    // Notify Patient directly
    await Notification.create({
      recipientId: patientId,
      recipientRole: 'patient',
      title: `💊 Prescribed Medicines from ${doctorProfile?.doctorName || req.user.name}`,
      message: `${doctorProfile?.doctorName || req.user.name} has completed your checkup and sent your digital prescription with ${medicines.length} prescribed medicine${medicines.length > 1 ? 's' : ''} (${medSummary}) directly to your platform.`,
      type: 'prescription',
      link: `/patient/prescriptions/${prescription._id}`,
    });

    res.status(201).json({
      success: true,
      prescription,
      message: 'Digital prescription successfully created and added to patient records.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/prescriptions
const getPrescriptions = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'patient') {
      query.patientId = req.user.id;
    } else if (req.user.role === 'doctor') {
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
