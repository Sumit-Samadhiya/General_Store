/**
 * File Upload Security Middleware
 * Validates and secures file uploads
 */

const fs = require('fs');
const path = require('path');
const { ValidationError, FileUploadError } = require('../utils/customErrors');
const { log } = require('../utils/logger');

/**
 * Allowed file extensions
 */
const ALLOWED_EXTENSIONS = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  document: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'],
  video: ['mp4', 'avi', 'mov', 'wmv', 'webm'],
  audio: ['mp3', 'wav', 'flac', 'm4a', 'aac']
};

/**
 * Allowed MIME types
 */
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  video: ['video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp4', 'audio/aac']
};

/**
 * File size limits (in bytes)
 */
const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 20 * 1024 * 1024, // 20MB
  default: 5 * 1024 * 1024 // 5MB
};

/**
 * Max files that can be uploaded at once
 */
const MAX_FILES_PER_UPLOAD = 5;

/**
 * Dangerous file types that should never be uploaded
 */
const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'com', 'pif', 'scr',
  'vbs', 'js', 'jse', 'ws', 'wsf', 'wsh',
  'sh', 'bash', 'app', 'deb', 'rpm',
  'zip', 'rar', '7z', 'tar', 'gz',
  'msi', 'dmg', 'pkg', 'run'
];

/**
 * Validate uploaded file
 * @param {Object} file - Multer file object
 * @param {string} fileType - Type of file (image, document, video, audio)
 * @returns {Object} Validation result
 */
const validateFile = (file, fileType = 'image') => {
  const errors = [];

  if (!file) {
    return {
      valid: false,
      errors: ['No file provided']
    };
  }

  // Get file extension
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  const filename = file.originalname.toLowerCase();

  // Check for dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    log.warn('Dangerous file type upload attempt', {
      extension: ext,
      filename: file.originalname,
      ip: req?.ip
    });

    errors.push(`File type .${ext} is not allowed`);
  }

  // Check file extension
  const allowedExts = ALLOWED_EXTENSIONS[fileType] || ALLOWED_EXTENSIONS.image;
  if (!allowedExts.includes(ext)) {
    errors.push(`File type .${ext} is not allowed for ${fileType}. Allowed types: ${allowedExts.join(', ')}`);
  }

  // Check MIME type
  const allowedMimes = ALLOWED_MIME_TYPES[fileType] || ALLOWED_MIME_TYPES.image;
  if (!allowedMimes.includes(file.mimetype.toLowerCase())) {
    log.warn('Invalid MIME type upload attempt', {
      mimetype: file.mimetype,
      expected: allowedMimes,
      filename: file.originalname
    });

    errors.push(`Invalid file type. Expected MIME type from: ${allowedMimes.join(', ')}`);
  }

  // Check file size
  const maxSize = FILE_SIZE_LIMITS[fileType] || FILE_SIZE_LIMITS.default;
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum of ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  // Check for suspicious filenames (trying to execute or traverse)
  if (filename.includes('../') || filename.includes('..\\') || filename.startsWith('.')) {
    log.warn('Suspicious filename detected', {
      filename: file.originalname,
      ip: req?.ip
    });

    errors.push('Invalid filename format');
  }

  // Check for null bytes (null injection)
  if (filename.includes('\0')) {
    log.warn('Null byte injection attempt', {
      filename: file.originalname,
      ip: req?.ip
    });

    errors.push('Invalid filename');
  }

  // Check for double extensions (potential bypass attempt)
  const parts = filename.split('.');
  if (parts.length > 2) {
    const doubleExt = parts.slice(-2).join('.').toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(parts[parts.length - 2])) {
      log.warn('Double extension upload attempt', {
        filename: file.originalname,
        doubleExt,
        ip: req?.ip
      });

      errors.push('Double extensions not allowed');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    file
  };
};

/**
 * Middleware to validate multiple files
 * @param {string} fileType - Type of files being uploaded
 * @param {number} maxFiles - Maximum number of files (default: MAX_FILES_PER_UPLOAD)
 */
const validateMultipleFiles = (fileType = 'image', maxFiles = MAX_FILES_PER_UPLOAD) => {
  return (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      throw new ValidationError('No files provided', [
        { field: 'files', message: 'At least one file is required' }
      ]);
    }

    if (req.files.length > maxFiles) {
      throw new ValidationError(`Too many files`, [
        { field: 'files', message: `Maximum ${maxFiles} files allowed per upload` }
      ]);
    }

    const allErrors = [];

    req.files.forEach((file, index) => {
      const validation = validateFile(file, fileType);

      if (!validation.valid) {
        allErrors.push({
          fileIndex: index,
          filename: file.originalname,
          errors: validation.errors
        });
      }
    });

    if (allErrors.length > 0) {
      log.warn('File validation failed for multiple files', {
        fileCount: req.files.length,
        failedCount: allErrors.length,
        errorDetails: allErrors
      });

      throw new ValidationError('File validation failed', allErrors);
    }

    next();
  };
};

/**
 * Middleware to validate single file
 * @param {string} fileType - Type of file being uploaded
 */
const validateSingleFile = (fileType = 'image') => {
  return (req, res, next) => {
    if (!req.file) {
      throw new ValidationError('No file provided', [
        { field: 'file', message: 'A file is required' }
      ]);
    }

    const validation = validateFile(req.file, fileType);

    if (!validation.valid) {
      log.warn('File validation failed', {
        filename: req.file.originalname,
        errors: validation.errors,
        ip: req.ip
      });

      throw new ValidationError('File validation failed', validation.errors.map(error => ({
        field: 'file',
        message: error
      })));
    }

    // Store validated file info
    req.validatedFile = req.file;
    next();
  };
};

/**
 * Sanitize filename to prevent issues
 * Removes special characters and potentially dangerous patterns
 */
const sanitizeFilename = (filename) => {
  // Remove path separators
  let cleaned = filename.replace(/\.\./g, '').replace(/[\/\\]/g, '');

  // Remove special characters that could cause issues
  cleaned = cleaned.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Remove multiple dots
  cleaned = cleaned.replace(/\.{2,}/g, '.');

  // Remove leading/trailing dots
  cleaned = cleaned.replace(/^\.+|\.+$/g, '');

  // Limit length to prevent filesystem issues
  if (cleaned.length > 255) {
    const ext = path.extname(cleaned);
    const name = cleaned.slice(0, 255 - ext.length);
    cleaned = name + ext;
  }

  return cleaned;
};

/**
 * Generate secure filename
 * Combines timestamp with hash to prevent collisions
 */
const generateSecureFilename = (originalFilename) => {
  const crypto = require('crypto');
  const ext = path.extname(originalFilename);
  const timestamp = Date.now();
  const hash = crypto.randomBytes(6).toString('hex');

  return `${timestamp}-${hash}${ext}`;
};

/**
 * Check if upload directory is safe
 */
const isSafeUploadPath = (uploadPath, baseDir) => {
  const resolvedPath = path.resolve(uploadPath);
  const resolvedBaseDir = path.resolve(baseDir);

  // Ensure the upload path is within the base directory
  return resolvedPath.startsWith(resolvedBaseDir);
};

/**
 * Ensure upload directory exists and is writable
 */
const ensureUploadDirExists = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Check write permission
    fs.accessSync(dirPath, fs.constants.W_OK);
    return true;
  } catch (error) {
    log.error('Upload directory error', error, { dirPath });
    return false;
  }
};

/**
 * Scan file for malware patterns (basic check)
 * For production, use a real antivirus library like clamalyajs
 */
const basicMalwareCheck = (filePath) => {
  const dangerousPatterns = [
    /eval\s*\(/gi,
    /exec\s*\(/gi,
    /system\s*\(/gi,
    /passthru\s*\(/gi,
    /shell_exec\s*\(/gi,
    /<script/gi,
    /onclick=/gi,
    /onerror=/gi,
    /onload=/gi
  ];

  try {
    const content = fs.readFileSync(filePath, 'utf8').substring(0, 10000); // Read first 10KB only

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return {
          safe: false,
          reason: 'Suspicious content detected'
        };
      }
    }

    return {
      safe: true
    };
  } catch (error) {
    // Binary files will throw error on utf8 read, which is expected
    // They're safe for most purposes
    return {
      safe: true
    };
  }
};

module.exports = {
  validateFile,
  validateSingleFile,
  validateMultipleFiles,
  sanitizeFilename,
  generateSecureFilename,
  isSafeUploadPath,
  ensureUploadDirExists,
  basicMalwareCheck,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  FILE_SIZE_LIMITS,
  MAX_FILES_PER_UPLOAD,
  DANGEROUS_EXTENSIONS
};
