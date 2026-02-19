/**
 * Upload Controller
 * Handles image upload endpoints and operations
 */

const { uploadImage, uploadBatchImages, deleteImage, generateImageVariants } = require('../utils/imageService');
const { getUploader, getMultiUploader } = require('../config/upload');

/**
 * POST /api/upload
 * Upload single image
 */
const uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const folder = req.query.folder || req.body.folder || 'products';
    const imageData = await uploadImage(req.file, folder);
    
    // Generate variants if cloud storage
    const variants = await generateImageVariants(imageData.url, imageData.cloudinaryId);

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: imageData.filename,
        url: imageData.url,
        path: imageData.path,
        size: imageData.size,
        mimetype: imageData.mimetype,
        variants: variants,
        cloudinaryId: imageData.cloudinaryId || null,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Image upload failed'
    });
  }
};

/**
 * POST /api/upload/batch
 * Upload multiple images
 */
const uploadBatchImage = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const folder = req.query.folder || req.body.folder || 'products';
    const result = await uploadBatchImages(req.files, folder);

    // Generate variants for each image
    const imagesWithVariants = await Promise.all(
      result.images.map(async (image) => ({
        ...image,
        variants: await generateImageVariants(image.url, image.cloudinaryId)
      }))
    );

    return res.status(201).json({
      success: true,
      message: `${result.count} images uploaded successfully`,
      data: {
        count: result.count,
        images: imagesWithVariants,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Batch upload error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Batch upload failed'
    });
  }
};

/**
 * DELETE /api/upload/:imageUrl
 * Delete uploaded image
 */
const deleteImageFile = async (req, res) => {
  try {
    const imageUrl = req.params.imageUrl;
    const cloudinaryId = req.body.cloudinaryId;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    // Decode URL if necessary
    const decodedUrl = decodeURIComponent(imageUrl);

    const result = await deleteImage(decodedUrl, cloudinaryId);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        deletedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Image deletion failed'
    });
  }
};

/**
 * GET /api/upload/info/:imageUrl
 * Get image information
 */
const getImageInfo = async (req, res) => {
  try {
    const imageUrl = decodeURIComponent(req.params.imageUrl);

    const variants = await generateImageVariants(imageUrl, req.query.cloudinaryId);

    return res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        variants: variants,
        cloudinaryId: req.query.cloudinaryId || null,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Info error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to get image info'
    });
  }
};

/**
 * Middleware: Upload Single File
 */
const uploadMiddleware = (fieldName = 'image', folder = 'products') => {
  return async (req, res, next) => {
    try {
      req.uploadFolder = folder;
      const uploader = getUploader(fieldName);
      uploader(req, res, (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }
        next();
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };
};

/**
 * Middleware: Upload Multiple Files
 */
const uploadMultiMiddleware = (fieldName = 'images', maxFiles = 5, folder = 'products') => {
  return async (req, res, next) => {
    try {
      req.uploadFolder = folder;
      const uploader = getMultiUploader(fieldName, { maxFiles });
      uploader(req, res, (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }
        next();
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };
};

/**
 * Serve Local Images Middleware
 * GET /images/:folder/:filename
 */
const serveLocalImage = (req, res) => {
  try {
    const { folder, filename } = req.params;
    const path = require('path');
    const fs = require('fs');

    const allowedFolders = ['products', 'profiles', 'banners'];
    if (!allowedFolders.includes(folder)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid folder'
      });
    }

    const imagePath = path.join(__dirname, `../../uploads/${folder}/${filename}`);

    // Security: Prevent path traversal
    if (!imagePath.startsWith(path.join(__dirname, '../../uploads'))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.sendFile(imagePath);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  uploadSingleImage,
  uploadBatchImage,
  deleteImageFile,
  getImageInfo,
  uploadMiddleware,
  uploadMultiMiddleware,
  serveLocalImage
};
