const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validate = require('../middleware/validation');
const verifyToken = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const adminProductController = require('../controllers/adminProductController');

// Validation schemas
const CATEGORY_OPTIONS = ['kitchen', 'snacks', 'beauty', 'bakery', 'household'];
const WEIGHT_OPTIONS = ['100g', '250g', '500g', '1kg'];
const HOUSEHOLD_SIZE_OPTIONS = ['250ml', '500ml', '1L', '2L'];

const createProductSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  brand: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(10).max(1000).optional(),
  category: Joi.string().valid(...CATEGORY_OPTIONS).lowercase().required(),
  weight: Joi.string()
    .valid(...WEIGHT_OPTIONS)
    .when('category', { is: 'household', then: Joi.forbidden(), otherwise: Joi.required() }),
  size: Joi.string()
    .valid(...HOUSEHOLD_SIZE_OPTIONS)
    .when('category', { is: 'household', then: Joi.required(), otherwise: Joi.forbidden() }),
  price: Joi.number().min(0.01).required(),
  discountedPrice: Joi.number().min(0).less(Joi.ref('price')).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  shopId: Joi.string().required(),
  isAvailable: Joi.boolean().optional()
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  brand: Joi.string().min(2).max(100).optional(),
  description: Joi.string().min(10).max(1000).optional(),
  category: Joi.string().valid(...CATEGORY_OPTIONS).lowercase().optional(),
  weight: Joi.string().valid(...WEIGHT_OPTIONS).optional(),
  size: Joi.string().valid(...HOUSEHOLD_SIZE_OPTIONS).optional(),
  price: Joi.number().min(0.01).optional(),
  discountedPrice: Joi.number().min(0).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  isAvailable: Joi.boolean().optional()
}).custom((value, helpers) => {
  const category = value.category;
  const weight = value.weight;
  const size = value.size;
  const price = value.price;
  const discountedPrice = value.discountedPrice;

  if (category === 'household') {
    if (weight !== undefined) {
      return helpers.error('any.invalid');
    }
    if (size === undefined) {
      return helpers.error('any.required');
    }
  }

  if (category && category !== 'household' && size !== undefined) {
    return helpers.error('any.invalid');
  }

  if (price !== undefined && discountedPrice !== undefined && discountedPrice >= price) {
    return helpers.error('any.invalid');
  }

  return value;
});

const bulkUpdateSchema = Joi.object({
  productIds: Joi.array().items(Joi.string()).min(1).required(),
  updates: Joi.object({
    price: Joi.number().min(0).optional(),
    discountedPrice: Joi.number().min(0).optional(),
    category: Joi.string().valid(...CATEGORY_OPTIONS).lowercase().optional(),
    brand: Joi.string().min(2).max(100).optional(),
    weight: Joi.string().valid(...WEIGHT_OPTIONS).optional(),
    size: Joi.string().valid(...HOUSEHOLD_SIZE_OPTIONS).optional(),
    isAvailable: Joi.boolean().optional()
  }).min(1).required()
});

const paginationSchema = Joi.object({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
  search: Joi.string().optional(),
  category: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.number().valid(-1, 1).optional()
});

/**
 * @route   POST /api/v1/admin/products
 * @desc    Create new product
 * @access  Private (Admin/Shop Owner)
 */
router.post(
  '/',
  verifyToken,
  authorize('admin', 'customer'),
  validate(createProductSchema),
  adminProductController.createProduct
);

/**
 * @route   GET /api/v1/admin/products
 * @desc    Get all products with pagination, search, filter
 * @access  Private (Admin/Shop Owner)
 */
router.get(
  '/',
  verifyToken,
  authorize('admin', 'customer'),
  adminProductController.getAllProducts
);

/**
 * @route   GET /api/v1/admin/products/stats/overview
 * @desc    Get product statistics
 * @access  Private (Admin/Shop Owner)
 */
router.get(
  '/stats/overview',
  verifyToken,
  authorize('admin', 'customer'),
  adminProductController.getProductStats
);

/**
 * @route   GET /api/v1/admin/products/:id
 * @desc    Get single product
 * @access  Private (Admin/Shop Owner)
 */
router.get(
  '/:id',
  verifyToken,
  authorize('admin', 'customer'),
  adminProductController.getProductById
);

/**
 * @route   PUT /api/v1/admin/products/:id
 * @desc    Update product
 * @access  Private (Admin/Shop Owner)
 */
router.put(
  '/:id',
  verifyToken,
  authorize('admin', 'customer'),
  validate(updateProductSchema),
  adminProductController.updateProduct
);

/**
 * @route   DELETE /api/v1/admin/products/:id
 * @desc    Soft delete product
 * @access  Private (Admin/Shop Owner)
 */
router.delete(
  '/:id',
  verifyToken,
  authorize('admin', 'customer'),
  adminProductController.deleteProduct
);

/**
 * @route   PATCH /api/v1/admin/products/bulk/update
 * @desc    Bulk update products
 * @access  Private (Admin/Shop Owner)
 */
router.patch(
  '/bulk/update',
  verifyToken,
  authorize('admin', 'customer'),
  validate(bulkUpdateSchema),
  adminProductController.bulkUpdateProducts
);

module.exports = router;
