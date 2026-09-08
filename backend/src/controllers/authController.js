const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, PatientProfile, DoctorProfile } = require('../models');
const { generateOpNumber } = require('../utils/opNumber');

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'medikiosk_sih_super_secure_jwt_secret_key_2026_prototype';
  return jwt.sign({ id, role }, secret, { expiresIn: '7d' });
};

// @route   POST /api/auth/register/patient
const registerPatient = async (req, res, next) => {
  try {
    const {
      name,
      age,
      phoneNumber,
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

    const cleanPhone = String(phoneNumber).trim();
    const existingUser = await User.findOne({ phoneNumber: cleanPhone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this phone number is already registered. Please log in instead.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const opNumber = generateOpNumber();

    const user = await User.create({
      phoneNumber: cleanPhone,
      password: hashedPassword,
      role: 'patient',
      name: name.trim(),
      opNumber,
    });

    const profile = await PatientProfile.create({
      userId: user._id,
      name: name.trim(),
      phoneNumber: cleanPhone,
      age: parseInt(age, 10),
      gender,
      bloodGroup,
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      preferredLanguage,
      opNumber,
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
      licenseNumber,
      specialization,
      phoneNumber,
      password,
      experienceYears = 5,
      hospitalAffiliation = 'MediKiosk Apex Hospital',
    } = req.body;

    if (!doctorName || !licenseNumber || !specialization || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: doctorName, licenseNumber, specialization, phoneNumber, and password.',
      });
    }

    const cleanPhone = String(phoneNumber).trim();
    const existingUser = await User.findOne({ phoneNumber: cleanPhone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this phone number is already registered.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      phoneNumber: cleanPhone,
      password: hashedPassword,
      role: 'doctor',
      name: doctorName.startsWith('Dr.') ? doctorName.trim() : `Dr. ${doctorName.trim()}`,
    });

    const profile = await DoctorProfile.create({
      userId: user._id,
      doctorName: user.name,
      licenseNumber: licenseNumber.trim(),
      specialization,
      phoneNumber: cleanPhone,
      experienceYears: parseInt(experienceYears, 10) || 5,
      hospitalAffiliation,
      demoVerified: true, // Clearly marked as Demo Verified per specification
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
    const { phoneNumber, password, role } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both phone number and password.',
      });
    }

    const cleanPhone = String(phoneNumber).trim();
    const user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password.',
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
        message: 'Invalid phone number or password.',
      });
    }

    let profile = null;
    let opNumber = user.opNumber || null;
    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ userId: user._id });
      if (!opNumber && profile?.opNumber) {
        opNumber = profile.opNumber;
      }
      // If legacy patient account has no opNumber, auto-generate and persist
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
    } else {
      profile = await DoctorProfile.findOne({ userId: user._id });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
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
    } else {
      profile = await DoctorProfile.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
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
  registerPatient,
  registerDoctor,
  login,
  getMe,
  logout,
};
