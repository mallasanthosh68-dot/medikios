const otpService = require('../services/otpService');
const { User, PatientProfile, HealthSummary } = require('../models');

/**
 * Helper to search for returning patient record in MongoDB / Local resilient store
 */
const findPatientByPhone = async (cleanPhone) => {
  if (!cleanPhone || cleanPhone.length !== 10) return null;

  try {
    // 1. Search User by Phone
    const user = await User.findOne({ phoneNumber: cleanPhone, role: 'patient' });
    let profile = user ? await PatientProfile.findOne({ userId: user._id }) : null;

    if (!profile) {
      profile = await PatientProfile.findOne({ phoneNumber: cleanPhone });
    }

    if (profile || user) {
      return {
        name: profile?.name || user?.name || '',
        phoneNumber: cleanPhone,
        age: profile?.age || null,
        gender: profile?.gender || 'Other',
        abhaId: profile?.abhaId || profile?.aadhaarDemoId || user?.abhaId || '',
        opNumber: profile?.opNumber || user?.opNumber || null,
        previousVisitsCount: Array.isArray(profile?.generatedOpNumbers)
          ? profile.generatedOpNumbers.length
          : 1,
      };
    }

    // 2. Search HealthSummary by Phone
    const summary = await HealthSummary.findOne({
      patientPhone: { $regex: cleanPhone },
    }).sort({ createdAt: -1 });

    if (summary) {
      return {
        name: summary.patientName || '',
        phoneNumber: cleanPhone,
        age: summary.patientAge || null,
        gender: summary.patientGender || 'Other',
        abhaId: summary.abhaId || '',
        opNumber: summary.opNumber || null,
        previousVisitsCount: 1,
      };
    }
  } catch (err) {
    console.warn('[Find Patient Notice]', err.message);
  }

  return null;
};

/**
 * POST /api/patient/send-otp
 * Also POST /api/auth/send-otp
 * Dispatches OTP via WhatsApp or SMS to the mobile number
 */
const sendPatientOtp = async (req, res, next) => {
  try {
    const { phoneNumber, channel = 'whatsapp', name = '' } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required to send verification OTP.',
      });
    }

    const result = await otpService.sendOtp({
      phoneNumber,
      channel,
      name,
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to dispatch verification OTP.',
    });
  }
};

/**
 * POST /api/patient/verify-otp
 * Also POST /api/auth/verify-otp
 * Verifies the 6-digit OTP and automatically fetches returning patient record if present
 */
const verifyPatientOtp = async (req, res, next) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Both mobile number and 6-digit OTP code are required.',
      });
    }

    const verificationResult = await otpService.verifyOtp({
      phoneNumber,
      otp,
    });

    const cleanPhone = verificationResult.phoneNumber;
    const existingPatient = await findPatientByPhone(cleanPhone);

    res.json({
      success: true,
      verified: true,
      phoneNumber: cleanPhone,
      isReturning: !!existingPatient,
      found: !!existingPatient,
      patient: existingPatient,
      message: existingPatient
        ? `✓ Mobile verified. Returning patient record retrieved for ${existingPatient.name}.`
        : '✓ Mobile number verified successfully. You may continue with registration.',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      verified: false,
      message: error.message || 'OTP verification failed.',
    });
  }
};

module.exports = {
  sendPatientOtp,
  verifyPatientOtp,
};

