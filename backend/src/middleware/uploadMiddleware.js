const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'meddoc-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/x-png',
    'image/webp',
    'application/pdf',
    'application/x-pdf',
    'application/octet-stream',
  ];
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

  if (allowedMimeTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only JPG, PNG, WEBP, and PDF documents are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

module.exports = upload;
