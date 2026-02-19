/**
 * Image Middleware
 * Handles image upload middleware and validation
 */

const path = require('path');
const fs = require('fs');

/**
 * Middleware: Validate uploaded image
 */
const validateUploadedImage = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  // Check file type
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedMimes.includes(req.file.mimetype)) {
    // Clean up uploaded file
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'
    });
  }

  next();
};

/**
 * Middleware: Validate batch uploaded images
 */
const validateUploadedImages = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  // Check each file
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  for (let file of req.files) {
    if (!allowedMimes.includes(file.mimetype)) {
      // Clean up all uploaded files
      req.files.forEach(f => {
        if (f.path && fs.existsSync(f.path)) {
          fs.unlinkSync(f.path);
        }
      });

      return res.status(400).json({
        success: false,
        message: 'One or more files have invalid type. Only JPEG, PNG, GIF, and WebP are allowed'
      });
    }
  }

  next();
};

/**
 * Middleware: Check image dimensions (requires image-size package)
 */
const validateImageDimensions = (minWidth = 0, minHeight = 0) => {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }

    // Only validate if image-size is available
    try {
      const imageSize = require('image-size');
      
      // For local storage
      if (req.file.path) {
        const dimensions = imageSize(req.file.path);
        if (dimensions.width < minWidth || dimensions.height < minHeight) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            success: false,
            message: `Image dimensions must be at least ${minWidth}x${minHeight}. Current: ${dimensions.width}x${dimensions.height}`
          });
        }
      }

      next();
    } catch (error) {
      // Image-size not available, skip validation
      console.warn('image-size package not available:', error.message);
      next();
    }
  };
};

/**
 * Middleware: Rate limit image uploads
 */
const rateLimitUpload = (maxUploads = 10, timeWindow = 3600000) => {
  const uploadCounts = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();

    if (!uploadCounts.has(userId)) {
      uploadCounts.set(userId, []);
    }

    const uploads = uploadCounts.get(userId);
    
    // Remove old uploads outside time window
    const filteredUploads = uploads.filter(time => now - time < timeWindow);
    uploadCounts.set(userId, filteredUploads);

    if (filteredUploads.length >= maxUploads) {
      return res.status(429).json({
        success: false,
        message: `Too many uploads. Max ${maxUploads} uploads per hour`,
        retryAfter: Math.ceil((filteredUploads[0] + timeWindow - now) / 1000)
      });
    }

    filteredUploads.push(now);
    next();
  };
};

/**
 * Middleware: Temporary file cleanup on error
 */
const cleanupOnError = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    // If response is an error, clean up uploaded files
    if (data && !data.success && (req.file || req.files)) {
      try {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        if (req.files && Array.isArray(req.files)) {
          req.files.forEach(file => {
            if (file.path && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        }
      } catch (error) {
        console.error('Error cleaning up files:', error);
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

module.exports = {
  validateUploadedImage,
  validateUploadedImages,
  validateImageDimensions,
  rateLimitUpload,
  cleanupOnError
};
