const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'evidences');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

const uploadEvidence = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      const error = new Error('Arquivo invalido. Use imagem JPG, PNG, WEBP ou HEIC.');
      error.status = 400;
      return cb(error);
    }
    return cb(null, true);
  }
});

module.exports = { uploadEvidence };
