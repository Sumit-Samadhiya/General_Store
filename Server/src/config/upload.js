/**
 * Upload Configuration
 * Handles image upload configuration for both local and cloud storage
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Allowed file types
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  product: 5 * 1024 * 1024,     // 5MB for product images
  profile: 2 * 1024 * 1024,     // 2MB for profile pictures
  banner: 10 * 1024 * 1024      // 10MB for banners
};

/**
 * Local Storage Configuration
 */
const createLocalStorage = () => {
  const uploadDir = path.join(__dirname, '../../uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Create subdirectories
  const subdirs = ['products', 'profiles', 'banners'];
  subdirs.forEach(subdir => {
    const dirPath = path.join(uploadDir, subdir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  return multer.diskStorage({
    destination: (req, file, cb) => {
      const folder = req.uploadFolder || 'products';
      const destPath = path.join(uploadDir, folder);
      cb(null, destPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
      cb(null, filename);
    }
  });
};

/**
 * File Filter Function
 */
const fileFilter = (req, file, cb) => {
  // Check mimetype
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return cb(
      new Error(`Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`)
    );
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`)
    );
  }

  cb(null, true);
};

/**
 * Get Multer Instance (Local Storage)
 */
const createLocalUploader = (fieldName = 'image', maxSize = FILE_SIZE_LIMITS.product) => {
  return multer({
    storage: createLocalStorage(),
    limits: { fileSize: maxSize },
    fileFilter: fileFilter
  }).single(fieldName);
};

/**
 * Get Multer Instance (Multiple Files)
 */
const createLocalMultiUploader = (fieldName = 'images', maxFiles = 5, maxSize = FILE_SIZE_LIMITS.product) => {
  return multer({
    storage: createLocalStorage(),
    limits: {
      fileSize: maxSize,
      files: maxFiles
    },
    fileFilter: fileFilter
  }).array(fieldName, maxFiles);
};

/**
 * Memory Storage for Cloud Upload (S3, Cloudinary)
 */
const createMemoryUploader = (fieldName = 'image', maxSize = FILE_SIZE_LIMITS.product) => {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize },
    fileFilter: fileFilter
  }).single(fieldName);
};

/**
 * Memory Storage for Multiple Cloud Uploads
 */
const createMemoryMultiUploader = (fieldName = 'images', maxFiles = 5, maxSize = FILE_SIZE_LIMITS.product) => {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxSize,
      files: maxFiles
    },
    fileFilter: fileFilter
  }).array(fieldName, maxFiles);
};

/**
 * Get Appropriate Uploader Based on Environment
 */
const getUploader = (fieldName = 'image', options = {}) => {
  const { maxSize = FILE_SIZE_LIMITS.product, isCloud = false } = options;

  if (process.env.STORAGE_TYPE === 's3' || process.env.STORAGE_TYPE === 'cloudinary' || isCloud) {
    return createMemoryUploader(fieldName, maxSize);
  }

  return createLocalUploader(fieldName, maxSize);
};

const getMultiUploader = (fieldName = 'images', options = {}) => {
  const { maxFiles = 5, maxSize = FILE_SIZE_LIMITS.product, isCloud = false } = options;

  if (process.env.STORAGE_TYPE === 's3' || process.env.STORAGE_TYPE === 'cloudinary' || isCloud) {
    return createMemoryMultiUploader(fieldName, maxFiles, maxSize);
  }

  return createLocalMultiUploader(fieldName, maxFiles, maxSize);
};

module.exports = {
  getUploader,
  getMultiUploader,
  createLocalUploader,
  createLocalMultiUploader,
  createMemoryUploader,
  createMemoryMultiUploader,
  fileFilter,
  ALLOWED_MIMETYPES,
  ALLOWED_EXTENSIONS,
  FILE_SIZE_LIMITS,
  uploadDir: path.join(__dirname, '../../uploads')
};
