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

// @route   GET /api/doctor/op-summary/:opNumber
// @route   POST /api/doctor/lookup-op
// Direct OP Number lookup: Doctor enters patient OP token to immediately inspect full AI health summary
const lookupOpSummary = async (req, res, next) => {
  try {
    const rawOp = req.params.opNumber || req.body.opNumber;
    if (!rawOp || !String(rawOp).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid OP Number to look up (e.g. OP-447118).',
      });
    }

    let cleanOp = String(rawOp).trim().toUpperCase();
    if (/^\d{6}$/.test(cleanOp)) {
      cleanOp = `OP-${cleanOp}`;
    }

    // 1. Search HealthSummary by opNumber (exact or regex)
    const escaped = cleanOp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let summary = await HealthSummary.findOne({
      opNumber: { $regex: new RegExp(`^${escaped}$`, 'i') }
    }).populate('patientId', 'name phoneNumber email age gender bloodGroup abhaId abhaAddress').lean();

    // 2. If not found by exact string, try finding by patient profile or user opNumber
    if (!summary) {
      const patientProfile = await PatientProfile.findOne({
        $or: [
          { opNumber: { $regex: new RegExp(`^${escaped}$`, 'i') } },
          { generatedOpNumbers: { $in: [cleanOp, rawOp.trim()] } },
        ]
      }).lean();

      if (patientProfile && patientProfile.userId) {
        summary = await HealthSummary.findOne({ patientId: patientProfile.userId })
          .sort({ createdAt: -1 })
          .populate('patientId', 'name phoneNumber email age gender bloodGroup abhaId abhaAddress')
          .lean();
      }
    }

    if (!summary) {
      const userWithOp = await User.findOne({
        opNumber: { $regex: new RegExp(`^${escaped}$`, 'i') }
      }).lean();

      if (userWithOp) {
        summary = await HealthSummary.findOne({ patientId: userWithOp._id })
          .sort({ createdAt: -1 })
          .populate('patientId', 'name phoneNumber email age gender bloodGroup abhaId abhaAddress')
          .lean();
      }
    }

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: `No clinical health summary found for OP Number "${cleanOp}". Please check the OP token with the patient.`,
      });
    }

    // Attach patient details
    let patient = summary.patientId;
    if (!patient || typeof patient !== 'object' || !patient.name) {
      const profile = await PatientProfile.findOne({ userId: summary.patientId }).lean().catch(() => null);
      const usr = await User.findById(summary.patientId).lean().catch(() => null);
      patient = {
        _id: summary.patientId || 'patient-walkin',
        name: summary.patientName || profile?.name || usr?.name || 'Walk-In Patient',
        phoneNumber: summary.patientPhone || profile?.phoneNumber || usr?.phoneNumber || '',
        age: summary.patientAge || profile?.age || usr?.age || '',
        gender: summary.patientGender || profile?.gender || usr?.gender || '',
        bloodGroup: profile?.bloodGroup || '',
        abhaId: summary.abhaId || profile?.abhaId || usr?.abhaId || '',
        abhaAddress: summary.abhaAddress || profile?.abhaAddress || usr?.abhaAddress || '',
      };
    } else {
      patient.abhaId = patient.abhaId || summary.abhaId || '';
      patient.abhaAddress = patient.abhaAddress || summary.abhaAddress || '';
    }

    // Ensure full interview responses dialogue is attached
    if (!summary.interviewResponses || summary.interviewResponses.length === 0) {
      if (summary.interviewId) {
        const interviewDoc = await HealthInterview.findById(summary.interviewId).lean().catch(() => null);
        if (interviewDoc && interviewDoc.responses && interviewDoc.responses.length > 0) {
          summary.interviewResponses = interviewDoc.responses;
        }
      }
    }

    return res.json({
      success: true,
      opNumber: summary.opNumber || cleanOp,
      summary,
      patient,
      message: `✓ Clinical Health Summary retrieved for OP ${summary.opNumber || cleanOp}!`,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/doctor/verify-op-number
// Pre-verifies patient OP number entered by doctor (supports verification by OP alone or OP + patientId)
const verifyPatientOpNumber = async (req, res, next) => {
  try {
    const { patientId, opNumber } = req.body;

    if (!opNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the OP Number to verify.',
      });
    }

    let cleanEnteredOp = String(opNumber).trim().toUpperCase();
    if (/^\d{6}$/.test(cleanEnteredOp)) {
      cleanEnteredOp = `OP-${cleanEnteredOp}`;
    }

    // If patientId is provided, verify against that patient
    if (patientId) {
      const patientUser = await User.findById(patientId);
      const patientProfile = await PatientProfile.findOne({ userId: patientId });

      const patientSummaries = await HealthSummary.find({ patientId }).lean().catch(() => []);
      const validOps = new Set();
      if (patientProfile?.opNumber) validOps.add(patientProfile.opNumber.trim().toUpperCase());
      if (patientUser?.opNumber) validOps.add(patientUser.opNumber.trim().toUpperCase());
      if (Array.isArray(patientProfile?.generatedOpNumbers)) {
        patientProfile.generatedOpNumbers.forEach((op) => validOps.add(String(op).trim().toUpperCase()));
      }
      patientSummaries.forEach((s) => {
        if (s.opNumber) validOps.add(String(s.opNumber).trim().toUpperCase());
      });

      if (validOps.has(cleanEnteredOp)) {
        return res.json({
          success: true,
          verified: true,
          opNumber: cleanEnteredOp,
          patientId,
          patientName: patientUser?.name || patientProfile?.name,
          message: `✓ Patient OP Number ${cleanEnteredOp} verified successfully! Prescribing unlocked.`,
        });
      }
    }

    // Direct lookup & verification by OP number alone across all summaries:
    const escaped = cleanEnteredOp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const summary = await HealthSummary.findOne({
      opNumber: { $regex: new RegExp(`^${escaped}$`, 'i') }
    }).lean();

    if (summary) {
      const patientProfile = await PatientProfile.findOne({ userId: summary.patientId }).lean().catch(() => null);
      const patientUser = await User.findById(summary.patientId).lean().catch(() => null);
      return res.json({
        success: true,
        verified: true,
        opNumber: summary.opNumber || cleanEnteredOp,
        patientId: summary.patientId,
        patientName: patientUser?.name || patientProfile?.name || 'Walk-In Patient',
        summary,
        message: `✓ Patient OP Number ${summary.opNumber || cleanEnteredOp} verified successfully! Prescribing unlocked.`,
      });
    }

    return res.status(400).json({
      success: false,
      verified: false,
      message: `Invalid OP Number "${opNumber}". Please enter the exact OP Number from the patient's screen.`,
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
  lookupOpSummary,
};
