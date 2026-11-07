const jwt = require('jsonwebtoken');
const { User, PatientProfile } = require('../models');

let directPatientCache = null;

const getOrCreateDirectPatient = async () => {
  if (directPatientCache) {
    return directPatientCache;
  }
  try {
    let user = await User.findOne({ phoneNumber: '9999900000', role: 'patient' });
    if (!user) {
      user = await User.findOne({ role: 'patient' });
    }
    if (!user) {
      user = await User.create({
        phoneNumber: '9999900000',
        password: '$2a$10$direct_patient_access_hash_dummy_2026',
        role: 'patient',
        name: 'Direct Patient',
      });
      try {
        await PatientProfile.create({
          userId: user._id,
          name: 'Direct Patient',
          phoneNumber: '9999900000',
          age: 35,
          gender: 'Other',
          preferredLanguage: 'en',
          opNumber: 'OP-' + Math.floor(100000 + Math.random() * 900000),
        });
      } catch (e) {}
    }
    if (user) {
      directPatientCache = user;
      return user;
    }
  } catch (err) {
    console.warn('[Direct Patient Notice] Using fallback direct patient record:', err.message);
  }

  const fallbackId = '6aa2cfdf8e8c1e2e5f5f3ca6';
  const fallbackUser = {
    _id: fallbackId,
    id: fallbackId,
    name: 'Direct Patient',
    phoneNumber: '9999900000',
    role: 'patient',
  };
  directPatientCache = fallbackUser;
  return fallbackUser;
};

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if target is a patient route (or public AI session) where patient can directly check health without logging in
  const isPatientRoute =
    req.baseUrl?.includes('/patients') ||
    req.baseUrl?.includes('/ai') ||
    req.baseUrl?.includes('/ayush') ||
    req.originalUrl?.includes('/api/patients') ||
    req.originalUrl?.includes('/api/ai') ||
    req.originalUrl?.includes('/api/ayush') ||
    req.path?.includes('/interview') ||
    req.path?.includes('/summary') ||
    req.path?.includes('/case') ||
    req.path?.includes('/chat') ||
    req.path?.includes('/lookup-patient');

  if (!token) {
    if (isPatientRoute) {
      try {
        const directUser = await getOrCreateDirectPatient();
        req.user = {
          _id: directUser._id,
          id: directUser._id,
          name: directUser.name,
          phoneNumber: directUser.phoneNumber,
          role: 'patient',
          isGuest: true,
        };
        return next();
      } catch (err) {
        console.error('Direct patient provisioning fallback:', err);
        const fallbackId = '6aa2cfdf8e8c1e2e5f5f3ca6';
        req.user = {
          _id: fallbackId,
          id: fallbackId,
          name: 'Direct Patient',
          phoneNumber: '9999900000',
          role: 'patient',
          isGuest: true,
        };
        return next();
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'medikiosk_sih_super_secure_jwt_secret_key_2026_prototype';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      if (isPatientRoute) {
        const directUser = await getOrCreateDirectPatient();
        req.user = {
          _id: directUser._id,
          id: directUser._id,
          name: directUser.name,
          phoneNumber: directUser.phoneNumber,
          role: 'patient',
          isGuest: true,
        };
        return next();
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
      });
    }

    req.user = {
      _id: user._id,
      id: user._id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };

    next();
  } catch (error) {
    if (isPatientRoute) {
      try {
        const directUser = await getOrCreateDirectPatient();
        req.user = {
          _id: directUser._id,
          id: directUser._id,
          name: directUser.name,
          phoneNumber: directUser.phoneNumber,
          role: 'patient',
          isGuest: true,
        };
        return next();
      } catch (err) {}
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized. Token verification failed.',
    });
  }
};

module.exports = { protect };

