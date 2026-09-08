const {
  User,
  DoctorProfile,
  PatientProfile,
  DoctorRequest,
  HealthSummary,
  MedicalDocument,
  MedicalExtraction,
  HealthInterview,
  MedicalTimeline,
  Notification,
} = require('../models');

// @route   GET /api/doctors
// Public/Patient searchable directory
const getDoctors = async (req, res, next) => {
  try {
    const { search, specialization } = req.query;
    let query = {};

    if (specialization && specialization !== 'All') {
      query.specialization = specialization;
    }

    if (search) {
      query.$or = [
        { doctorName: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const doctors = await DoctorProfile.find(query);
    res.json({ success: true, doctors });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/doctors/:id
const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }
    res.json({ success: true, doctor });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/doctor-requests
// Patient submits request to a selected doctor with consent & summary
const createDoctorRequest = async (req, res, next) => {
  try {
    const { doctorId, summaryId, documentIds = [], consentId } = req.body;

    if (!doctorId || !summaryId) {
      return res.status(400).json({ success: false, message: 'Doctor ID and Health Summary ID are required.' });
    }

    // Resolve doctorId: could be DoctorProfile._id or User._id
    let targetDoctorUserId = doctorId;
    const docProfile = await DoctorProfile.findById(doctorId);
    if (docProfile && docProfile.userId) {
      targetDoctorUserId = docProfile.userId;
    }

    const doctorUser = await User.findById(targetDoctorUserId);
    const summary = await HealthSummary.findById(summaryId);
    const patientProfile = await PatientProfile.findOne({ userId: req.user.id });

    if (!summary) {
      return res.status(404).json({ success: false, message: 'Health Summary not found.' });
    }

    const request = await DoctorRequest.create({
      patientId: req.user.id,
      doctorId: targetDoctorUserId,
      summaryId,
      documentIds,
      consentId: consentId || null,
      patientName: req.user.name,
      opNumber: patientProfile?.opNumber || req.user.opNumber || summary.opNumber || '',
      patientAge: patientProfile?.age || 35,
      patientGender: patientProfile?.gender || 'Not specified',
      patientPhone: req.user.phoneNumber,
      chiefComplaint: summary.chiefComplaint,
      priority: summary.redFlagStatus === 'HIGH_PRIORITY' ? 'HIGH_PRIORITY' : 'NORMAL',
      status: 'PENDING',
      appointmentDate: 'Tomorrow',
      appointmentSlot: '10:00 AM - 01:00 PM',
    });

    // Update summary status
    await HealthSummary.findByIdAndUpdate(summaryId, {
      $set: { status: 'SHARED_WITH_DOCTOR' },
    });

    // Send notification to Doctor
    await Notification.create({
      recipientId: targetDoctorUserId,
      recipientRole: 'doctor',
      title: 'New Patient Health Summary Received',
      message: `${req.user.name} shared a clinical health summary regarding: "${summary.chiefComplaint}". Tap to review and accept checkup.`,
      type: 'request',
      link: `/doctor/requests/${request._id}`,
    });

    res.status(201).json({
      success: true,
      request,
      message: 'Health summary successfully shared with doctor. Doctor has been notified.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/doctor/requests
// Doctor views requests sent to them
const getDoctorRequests = async (req, res, next) => {
  try {
    const requests = await DoctorRequest.find({ doctorId: req.user.id });
    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/doctor/requests/:id
// Comprehensive clinical dossier
const getSingleDoctorRequest = async (req, res, next) => {
  try {
    const request = await DoctorRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const [patientUser, patientProfile, summary, documents, extractions, timeline] = await Promise.all([
      User.findById(request.patientId),
      PatientProfile.findOne({ userId: request.patientId }),
      HealthSummary.findById(request.summaryId),
      MedicalDocument.find({ patientId: request.patientId }),
      MedicalExtraction.find({ patientId: request.patientId }),
      MedicalTimeline.find({ patientId: request.patientId }),
    ]);

    let interview = null;
    if (summary?.interviewId) {
      interview = await HealthInterview.findById(summary.interviewId);
    }

    res.json({
      success: true,
      request,
      patient: {
        id: patientUser?._id,
        name: patientUser?.name,
        phoneNumber: patientUser?.phoneNumber,
        age: patientProfile?.age,
        gender: patientProfile?.gender,
        bloodGroup: patientProfile?.bloodGroup,
        weight: patientProfile?.weight,
        height: patientProfile?.height,
        aadhaarDemoVerified: patientProfile?.aadhaarDemoVerified,
      },
      summary,
      interview,
      documents,
      extractions,
      timeline,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/doctor/summaries/:id
// Doctor edits summary or adds clinical notes
const updateDoctorSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { clinicalNotes, doctorEdits, suggestedSpecialty } = req.body;

    const summary = await HealthSummary.findById(id);
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Health summary not found.' });
    }

    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });

    const updated = await HealthSummary.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(suggestedSpecialty && { suggestedSpecialty }),
          'doctorReview.clinicalNotes': clinicalNotes || summary.doctorReview?.clinicalNotes || '',
          'doctorReview.doctorEdits': doctorEdits || summary.doctorReview?.doctorEdits || '',
          'doctorReview.doctorId': req.user.id,
          'doctorReview.doctorName': doctorProfile?.doctorName || req.user.name,
          'doctorReview.licenseNumber': doctorProfile?.licenseNumber || 'MCI-DEMO-001',
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      summary: updated,
      message: 'Clinical notes and edits recorded successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/doctor/confirm-review/:requestId
// Doctor confirms review, signs with badge and timestamp
const confirmDoctorReview = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { clinicalNotes, doctorEdits } = req.body;

    const request = await DoctorRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    const now = new Date();

    // Update Request status
    await DoctorRequest.findByIdAndUpdate(requestId, {
      $set: {
        status: 'REVIEWED',
        clinicalNotes: clinicalNotes || request.clinicalNotes,
        reviewedAt: now,
      },
    });

    // Update Health Summary
    const updatedSummary = await HealthSummary.findByIdAndUpdate(
      request.summaryId,
      {
        $set: {
          status: 'DOCTOR_REVIEWED',
          doctorReview: {
            doctorId: req.user.id,
            doctorName: doctorProfile?.doctorName || req.user.name,
            licenseNumber: doctorProfile?.licenseNumber || 'MCI-DEMO-10023',
            reviewedAt: now,
            clinicalNotes: clinicalNotes || 'Patient triage and previous records verified clinically.',
            doctorEdits: doctorEdits || '',
          },
        },
      },
      { new: true }
    );

    // Notify Patient
    await Notification.create({
      recipientId: request.patientId,
      recipientRole: 'patient',
      title: '✓ Doctor Reviewed Your Health Summary',
      message: `${doctorProfile?.doctorName || req.user.name} has completed reviewing your health records and symptoms.`,
      type: 'review',
      link: `/patient/summary`,
    });

    res.json({
      success: true,
      status: 'DOCTOR_REVIEWED',
      reviewedBy: {
        doctorName: doctorProfile?.doctorName || req.user.name,
        licenseNumber: doctorProfile?.licenseNumber || 'MCI-DEMO-10023',
        reviewedAt: now,
      },
      summary: updatedSummary,
      message: 'Clinical review confirmed. Stamp applied: ✓ Doctor Reviewed.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/doctor/requests/:requestId/accept
// Doctor accepts the patient summary and schedules in-person checkup (default: Tomorrow)
const acceptDoctorRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const {
      appointmentDate = 'Tomorrow',
      appointmentSlot = '10:00 AM - 01:00 PM',
      doctorMessage = 'Your health summary has been accepted. Please visit tomorrow for in-person clinical checkup at MediKiosk Apex Hospital.',
    } = req.body;

    const request = await DoctorRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Patient request not found.' });
    }

    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    const doctorName = doctorProfile?.doctorName || req.user.name;
    const doctorSpecialty = doctorProfile?.specialization || 'Consultant Specialist';
    const now = new Date();

    // Update Doctor Request status to ACCEPTED
    const updatedRequest = await DoctorRequest.findByIdAndUpdate(
      requestId,
      {
        $set: {
          status: 'ACCEPTED',
          appointmentDate,
          appointmentSlot,
          doctorMessage,
          acceptedAt: now,
        },
      },
      { new: true }
    );

    // Update Health Summary status to ACCEPTED_BY_DOCTOR
    if (request.summaryId) {
      await HealthSummary.findByIdAndUpdate(request.summaryId, {
        $set: {
          status: 'ACCEPTED_BY_DOCTOR',
          'doctorReview.doctorId': req.user.id,
          'doctorReview.doctorName': doctorName,
          'doctorReview.licenseNumber': doctorProfile?.licenseNumber || 'MCI-REG-10023',
          'doctorReview.reviewedAt': now,
          'doctorReview.clinicalNotes': doctorMessage,
          updatedAt: now,
        },
      });
    }

    // Add Timeline Event for Patient
    await MedicalTimeline.create({
      patientId: request.patientId,
      eventDate: now,
      year: now.getFullYear(),
      eventType: 'APPOINTMENT',
      title: `Checkup Scheduled with ${doctorName}`,
      summary: `Dr. ${doctorName} accepted your health summary. Visit scheduled: ${appointmentDate} (${appointmentSlot}). ${doctorMessage}`,
      doctorOrFacility: `${doctorName} (${doctorSpecialty})`,
      keyMetrics: [
        { label: 'Status', value: 'Doctor Accepted' },
        { label: 'Visit Time', value: `${appointmentDate} (${appointmentSlot})` },
      ],
    });

    // Notify Patient directly with the acceptance details
    await Notification.create({
      recipientId: request.patientId,
      recipientRole: 'patient',
      title: '✓ Doctor Accepted Your Health Summary',
      message: `Dr. ${doctorName} has accepted your health summary! You can go tomorrow (${appointmentSlot}) for your checkup. Note: "${doctorMessage}"`,
      type: 'request',
      link: '/patient/dashboard',
    });

    res.json({
      success: true,
      request: updatedRequest,
      message: `Health summary accepted. Patient has been notified to come ${appointmentDate} for checkup.`,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/doctor/verify-op-number
// Pre-verifies patient OP number entered by doctor
const verifyPatientOpNumber = async (req, res, next) => {
  try {
    const { patientId, opNumber } = req.body;

    if (!patientId || !opNumber) {
      return res.status(400).json({
        success: false,
        message: 'Both patientId and opNumber are required for verification.',
      });
    }

    const patientUser = await User.findById(patientId);
    const patientProfile = await PatientProfile.findOne({ userId: patientId });

    if (!patientUser && !patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient record not found.',
      });
    }

    const cleanEnteredOp = String(opNumber).trim().toUpperCase();
    const expectedOp = (patientProfile?.opNumber || patientUser?.opNumber || '').trim().toUpperCase();

    if (!expectedOp) {
      return res.status(400).json({
        success: false,
        message: 'Patient has not yet been assigned an OP Number.',
      });
    }

    if (cleanEnteredOp !== expectedOp) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: `Invalid OP Number "${opNumber}". Please enter the exact OP Number given by the patient.`,
      });
    }

    return res.json({
      success: true,
      verified: true,
      opNumber: expectedOp,
      patientName: patientUser?.name || patientProfile?.name,
      message: `✓ Patient OP Number ${expectedOp} verified successfully! Prescribing unlocked.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctorRequest,
  getDoctorRequests,
  getSingleDoctorRequest,
  updateDoctorSummary,
  confirmDoctorReview,
  acceptDoctorRequest,
  verifyPatientOpNumber,
};
