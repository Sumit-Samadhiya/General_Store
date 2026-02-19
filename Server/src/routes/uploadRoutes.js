/**
 * Upload Routes
 * Image upload, deletion, and retrieval endpoints
 */

const express = require('express');
const router = express.Router();
const {
  uploadSingleImage,
  uploadBatchImage,
  deleteImageFile,
  getImageInfo,
  uploadMiddleware,
  uploadMultiMiddleware,
  serveLocalImage
} = require('../controllers/uploadController');

/**
 * POST /api/upload
 * Upload single image
 * Query: folder (products, profiles, banners)
 * Body: Form-data with 'image' field
 */
router.post(
  '/',
  uploadMiddleware('image', 'products'),
  uploadSingleImage
);

/**
 * POST /api/upload/batch
 * Upload multiple images
 * Query: folder (products, profiles, banners)
 * Body: Form-data with 'images' field (max 5 files)
 */
router.post(
  '/batch',
  uploadMultiMiddleware('images', 5, 'products'),
  uploadBatchImage
);

/**
 * DELETE /api/upload/:imageUrl
 * Delete uploaded image
 * Params: imageUrl (encoded)
 * Body: { cloudinaryId } (optional, for Cloudinary)
 */
router.delete(
  '/:imageUrl',
  deleteImageFile
);

/**
 * GET /api/upload/info/:imageUrl
 * Get image information and variants
 * Params: imageUrl (encoded)
 * Query: cloudinaryId (optional)
 */
router.get(
  '/info/:imageUrl',
  getImageInfo
);

/**
 * Image Serving Routes for Local Storage
 * GET /images/:folder/:filename
 */
router.get(
  '/../../images/:folder/:filename',
  serveLocalImage
);

module.exports = router;
