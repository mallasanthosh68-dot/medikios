const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, PatientProfile, DoctorProfile } = require('../models');
const { generateOpNumber } = require('../utils/opNumber');

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'medikiosk_sih_super_secure_jwt_secret_key_2026_prototype';
  return jwt.sign({ id, role }, secret, { expiresIn: '7d' });
};

/**
 * Strict Indian Mobile Number Validation using Regular Expressions
 * 1. Must be 10 digits starting strictly with 6, 7, 8, or 9
 * 2. Rejects repetitive fake numbers (e.g., all 0s, all 9s, all 8s)
 * 3. Rejects known dummy test numbers
 */
const validateIndianMobile = (phoneNumber) => {
  if (!phoneNumber) {
    return { isValid: false, message: 'Phone number is required.' };
  }

  // Strip all non-digits (handles spaces, hyphens, leading +91)
  const cleaned = String(phoneNumber).trim().replace(/\D/g, '');
  const trimmed = cleaned.startsWith('91') && cleaned.length === 12 ? cleaned.slice(2) : cleaned;

  // 1. Strict regex: exactly 10 digits, starting with 6, 7, 8, or 9
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(trimmed)) {
    return {
      isValid: false,
      message: 'Invalid mobile number. Must be a genuine 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
    };
  }

  // 2. Reject repetitive identical digits (e.g. 0000000000, 9999999999, 8888888888)
  const repetitiveRegex = /^(\d)\1{9}$/;
  if (repetitiveRegex.test(trimmed)) {
    return {
      isValid: false,
      message: 'Invalid mobile number. Repetitive sequences (e.g., all 9s or all zeros) are not permitted.',
    };
  }

  // 3. Reject known dummy or test sequences
  const fakeSequences = [
    '9876543210', '9876543211', '9123456789', '9000000000',
    '8000000000', '7000000000', '6000000000', '9898989898',
    '9191919191', '9090909090'
  ];
  if (fakeSequences.includes(trimmed)) {
    return {
      isValid: false,
      message: 'This mobile number appears to be a test/dummy sequence. Please enter a genuine mobile number.',
    };
  }

  return { isValid: true, normalized: trimmed };
};

// @route   POST /api/auth/send-otp
const sendOtp = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    const phoneCheck = validateIndianMobile(phoneNumber);

    if (!phoneCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: phoneCheck.message,
      });
    }

    // Simulated 6-digit OTP generation (for prototype evaluation)
    const simulatedOtp = '123456';

    return res.json({
      success: true,
      message: `OTP sent successfully to +91 ${phoneCheck.normalized}.`,
      normalizedPhone: phoneCheck.normalized,
      demoOtp: simulatedOtp,
    });
  } catch (error) {
    next(error);
  }
};

// Helper to seed default admin if none exists or update credentials
const ensureAdminUser = async () => {
  try {
    let admin = await User.findOne({ role: 'admin' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('midikiosk@adminpass', salt);

    if (!admin) {
      admin = await User.create({
        phoneNumber: 'ADMIN_NO_PHONE',
        email: 'admin321@gmail.com',
        password: hashedPassword,
        role: 'admin',
        name: 'Hospital Super Administrator',
      });
      console.log('✓ Default MediKiosk Admin seeded: admin321@gmail.com (Email Only) / midikiosk@adminpass');
    } else {
      admin.email = 'admin321@gmail.com';
      admin.phoneNumber = 'ADMIN_NO_PHONE';
      admin.password = hashedPassword;
      if (typeof admin.save === 'function') {
        await admin.save();
      } else {
        await User.findByIdAndUpdate(admin._id, {
          $set: {
            email: 'admin321@gmail.com',
            phoneNumber: 'ADMIN_NO_PHONE',
            password: hashedPassword,
          },
        });
      }
      console.log('✓ MediKiosk Admin credentials updated: admin321@gmail.com (Email Only) / midikiosk@adminpass');
    }
    return admin;
  } catch (err) {
    console.warn('Admin seed notice:', err.message);
  }
};

// @route   POST /api/auth/register/patient
const registerPatient = async (req, res, next) => {
  try {
    const {
      name,
      age,
      phoneNumber,
      email = '',
      gender,
      password,
      bloodGroup = 'Not specified',
      weight = null,
      height = null,
      preferredLanguage = 'en',
    } = req.body;

    if (!name || !age || !phoneNumber || !gender || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, age, phoneNumber, gender, and password.',
      });
    }

    // Strict Indian mobile validation
    const phoneCheck = validateIndianMobile(phoneNumber);
    if (!phoneCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: phoneCheck.message,
      });
    }
    const cleanPhone = phoneCheck.normalized;

    // Optional email validation
    let cleanEmail = String(email || '').trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Check if user exists with phone or email
    const existingPhone = await User.findOne({ phoneNumber: cleanPhone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'A user with this phone number is already registered. Please log in instead.',
      });
    }

    if (cleanEmail) {
      const existingEmail = await User.findOne({ email: cleanEmail });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email address is already registered. Please log in instead.',
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const opNumber = generateOpNumber();

    const rawAbha = (req.body.abhaId || req.body.abhaNumber || '').trim();
    let cleanAbha = '';
    if (rawAbha) {
      const { validateAbhaNumber } = require('../utils/abhaValidation');
      const abhaVal = validateAbhaNumber(rawAbha);
      cleanAbha = abhaVal.formatted || rawAbha;
    }

    const user = await User.create({
      phoneNumber: cleanPhone,
      email: cleanEmail,
      password: hashedPassword,
      role: 'patient',
      name: name.trim(),
      opNumber,
      abhaId: cleanAbha,
    });

    const profile = await PatientProfile.create({
      userId: user._id,
      name: name.trim(),
      phoneNumber: cleanPhone,
      email: cleanEmail,
      age: parseInt(age, 10),
      gender,
      bloodGroup,
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      preferredLanguage,
      opNumber,
      abhaId: cleanAbha,
      aadhaarDemoId: cleanAbha,
    });

    const token = generateToken(user._id, 'patient');

    res.status(201).json({
      success: true,
      message: 'Patient registration successful. Welcome to MediKiosk!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        opNumber,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/register/doctor
const registerDoctor = async (req, res, next) => {
  try {
    const {
      doctorName,
      name,
      licenseNumber,
      license,
      specialization,
      phoneNumber,
      phone,
      email = '',
      password,
      experienceYears = 5,
      hospitalAffiliation = 'MediKiosk Apex Hospital',
    } = req.body;

    const finalDoctorName = String(doctorName || name || '').trim();
    const finalLicense = String(licenseNumber || license || '').trim();
    const rawPhone = String(phoneNumber || phone || '').trim();

    if (!finalDoctorName || !finalLicense || !specialization || !rawPhone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: doctorName, licenseNumber, specialization, phoneNumber, and password.',
      });
    }

    const phoneCheck = validateIndianMobile(rawPhone);
    if (!phoneCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: phoneCheck.message,
      });
    }
    const cleanPhone = phoneCheck.normalized;

    const existingUser = await User.findOne({ phoneNumber: cleanPhone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this phone number is already registered.',
      });
    }

    let cleanEmail = String(email || '').trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      phoneNumber: cleanPhone,
      email: cleanEmail,
      password: hashedPassword,
      role: 'doctor',
      name: finalDoctorName.startsWith('Dr.') ? finalDoctorName : `Dr. ${finalDoctorName}`,
    });

    const profile = await DoctorProfile.create({
      userId: user._id,
      doctorName: user.name,
      licenseNumber: finalLicense,
      specialization,
      phoneNumber: cleanPhone,
      experienceYears: parseInt(experienceYears, 10) || 5,
      hospitalAffiliation,
      demoVerified: true,
    });

    const token = generateToken(user._id, 'doctor');

    res.status(201).json({
      success: true,
      message: 'Doctor account registered successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { phoneNumber, email, identifier, password, role } = req.body;

    const targetInput = (identifier || email || phoneNumber || '').trim();

    if (!targetInput || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your phone number / email and password.',
      });
    }

    // Administrator login strictly requires an administrative email address
    if (role === 'admin') {
      if (!targetInput.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'Administrator login strictly requires your administrative email address (admin321@gmail.com). Phone number login is not permitted for admin.',
        });
      }
      await ensureAdminUser();
    } else if (targetInput.toLowerCase() === 'admin321@gmail.com') {
      await ensureAdminUser();
    }

    const isEmailInput = targetInput.includes('@');
    let user = null;

    if (isEmailInput) {
      user = await User.findOne({ email: targetInput.toLowerCase() });
    } else {
      // Clean phone input
      const cleaned = targetInput.replace(/\D/g, '');
      const trimmed = cleaned.startsWith('91') && cleaned.length === 12 ? cleaned.slice(2) : cleaned;
      if (trimmed.length === 10) {
        user = await User.findOne({ phoneNumber: trimmed });
      }
      if (!user) {
        // Fallback check by raw string
        user = await User.findOne({ phoneNumber: targetInput });
      }
    }

    // If still not found and not an email, try matching by email in case of typo or vice versa
    if (!user) {
      user = await User.findOne({
        $or: [
          { phoneNumber: targetInput },
          { email: targetInput.toLowerCase() }
        ]
      });
    }

    // Flexible Doctor Lookup: By License Number or Doctor Name in DoctorProfile
    if (!user) {
      const escapedInput = targetInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const docProfile = await DoctorProfile.findOne({
        $or: [
          { licenseNumber: { $regex: new RegExp(`^${escapedInput}$`, 'i') } },
          { doctorName: { $regex: new RegExp(`^${escapedInput}$`, 'i') } },
          { doctorName: { $regex: new RegExp(`^Dr\\.?\\s*${escapedInput}$`, 'i') } },
        ]
      });
      if (docProfile && docProfile.userId) {
        user = await User.findById(docProfile.userId);
      }
    }

    // Fallback search by Name in User collection
    if (!user) {
      const escapedInput = targetInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({
        name: { $regex: new RegExp(`^(Dr\\.?\\s*)?${escapedInput}$`, 'i') }
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User account not found.',
      });
    }

    // Block any attempt to access an administrator account via a phone number
    if (user.role === 'admin' && !isEmailInput) {
      return res.status(403).json({
        success: false,
        message: 'Administrator accounts cannot be accessed via phone number. Please log in using your administrative email address (admin321@gmail.com).',
      });
    }

    // Role match verification if specified
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `Account is registered as a ${user.role}, not a ${role}. Please select the correct portal.`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    let profile = null;
    let opNumber = user.opNumber || null;

    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ userId: user._id });
      if (!opNumber && profile?.opNumber) {
        opNumber = profile.opNumber;
      }
      if (!opNumber) {
        opNumber = generateOpNumber();
        await User.findByIdAndUpdate(user._id, { $set: { opNumber } });
        if (profile) {
          await PatientProfile.findByIdAndUpdate(profile._id, { $set: { opNumber } });
          profile.opNumber = opNumber;
        }
      }
      if (profile && !profile.opNumber) {
        profile.opNumber = opNumber;
        await PatientProfile.findByIdAndUpdate(profile._id, { $set: { opNumber } });
      }
    } else if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ userId: user._id });
    } else if (user.role === 'admin') {
      profile = {
        adminId: 'MK-ADM-001',
        name: user.name,
        email: user.email || 'admin321@gmail.com',
        phoneNumber: '',
        department: 'Central IT & Clinical Governance',
        accessLevel: 'SuperAdmin',
        privileges: [
          'User Management & Role Assignment',
          'Doctor License & Verification Management',
          'Patient Longitudinal Records & OP Governance',
          'Emergency Red-Flag Audit Logs',
          'ABDM & HL7 FHIR Bridge Monitor',
          'System Telemetry & Database Diagnostics',
        ],
        lastLogin: new Date().toISOString(),
      };
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.role === 'admin' ? '' : user.phoneNumber,
        email: user.email || '',
        role: user.role,
        opNumber,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let profile = null;
    let opNumber = user.opNumber || null;

    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ userId: user._id });
      if (!opNumber && profile?.opNumber) {
        opNumber = profile.opNumber;
      }
      if (!opNumber) {
        opNumber = generateOpNumber();
        await User.findByIdAndUpdate(user._id, { $set: { opNumber } });
        if (profile) {
          await PatientProfile.findByIdAndUpdate(profile._id, { $set: { opNumber } });
          profile.opNumber = opNumber;
        }
      }
      if (profile && !profile.opNumber) {
        profile.opNumber = opNumber;
        await PatientProfile.findByIdAndUpdate(profile._id, { $set: { opNumber } });
      }
    } else if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ userId: user._id });
    } else if (user.role === 'admin') {
      profile = {
        adminId: 'MK-ADM-001',
        name: user.name,
        email: user.email || 'admin321@gmail.com',
        phoneNumber: '',
        department: 'Central IT & Clinical Governance',
        accessLevel: 'SuperAdmin',
        privileges: [
          'User Management & Role Assignment',
          'Doctor License & Verification Management',
          'Patient Longitudinal Records & OP Governance',
          'Emergency Red-Flag Audit Logs',
          'ABDM & HL7 FHIR Bridge Monitor',
          'System Telemetry & Database Diagnostics',
        ],
        lastLogin: new Date().toISOString(),
      };
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.role === 'admin' ? '' : user.phoneNumber,
        email: user.email || '',
        role: user.role,
        opNumber,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/logout
const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

module.exports = {
  validateIndianMobile,
  sendOtp,
  registerPatient,
  registerDoctor,
  login,
  getMe,
  logout,
  ensureAdminUser,
};
