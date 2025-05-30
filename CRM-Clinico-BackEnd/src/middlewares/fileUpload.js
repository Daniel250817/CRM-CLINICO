const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../utils/errors');

// Directorios para almacenar archivos
const uploadsDir = path.join(__dirname, '../../uploads');
const medicalRecordsDir = path.join(uploadsDir, 'medical-records');
const xraysDir = path.join(uploadsDir, 'xrays');
const documentsDir = path.join(uploadsDir, 'documents');
const avatarsDir = path.join(uploadsDir, 'avatars');
const serviciosDir = path.join(uploadsDir, 'servicios');

// Asegurar que los directorios existan
[uploadsDir, medicalRecordsDir, xraysDir, documentsDir, avatarsDir, serviciosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for medical records
const medicalRecordsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, medicalRecordsDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Configure storage for x-rays
const xraysStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, xraysDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Configure storage for general documents
const documentsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Configure storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `avatar-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Configure storage for service images
const servicioImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, serviciosDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `servicio-${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter for allowed document types
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Tipo de archivo no permitido. Solo se permiten PDF, DOC, DOCX, TXT, JPG y PNG', 400), false);
  }
};

// File filter for x-rays
const xrayFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/dicom'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Tipo de archivo no permitido. Solo se permiten JPG, PNG y DICOM', 400), false);
  }
};

// File filter for avatars
const avatarFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Tipo de archivo no permitido. Solo se permiten JPG, PNG y GIF', 400), false);
  }
};

// File filter for service images
const servicioImageFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Tipo de archivo no permitido para imágenes de servicio. Solo se permiten JPG, PNG y WEBP', 400), false);
  }
};

// Configure multer instances
const uploadMedicalRecord = multer({
  storage: medicalRecordsStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const uploadXray = multer({
  storage: xraysStorage,
  fileFilter: xrayFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB para imágenes DICOM
  }
});

const uploadDocument = multer({
  storage: documentsStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Configure multer for avatars
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Configure multer for service images
const uploadServiceImage = multer({
  storage: servicioImageStorage,
  fileFilter: servicioImageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('El archivo es demasiado grande', 400));
    }
    return next(new AppError(err.message, 400));
  }
  next(err);
};

module.exports = {
  uploadMedicalRecord,
  uploadXray,
  uploadDocument,
  uploadAvatar,
  uploadServiceImage,
  handleMulterError
};
