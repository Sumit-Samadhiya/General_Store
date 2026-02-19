const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Category = require('../models/Category.js');
const Product = require('../models/Product.js');
const verifyToken = require('../middleware/auth.js');
const authorize = require('../middleware/rbac.js');

// Validation schema
const categorySchema = {
  create: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    description: Joi.string().trim().max(500).optional().allow(''),
    isActive: Joi.boolean().optional()
  }),
  update: Joi.object({
    name: Joi.string().trim().min(2).max(50).optional(),
    description: Joi.string().trim().max(500).optional().allow(''),
    isActive: Joi.boolean().optional()
  })
};

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories (Admin)
 * @access  Private/Admin
 */
router.get('/', verifyToken, authorize('admin'), async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 });

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({
          category: cat._id
        });
        return {
          ...cat.toJSON(),
          productCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: categoriesWithCount
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories: ' + error.message
    });
  }
});

/**
 * @route   GET /api/v1/categories/public/all
 * @desc    Get all active categories (Public)
 * @access  Public
 */
router.get('/public/all', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get public categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories: ' + error.message
    });
  }
});

/**
 * @route   POST /api/v1/categories
 * @desc    Create new category (Admin)
 * @access  Private/Admin
 */
router.post('/', verifyToken, authorize('admin'), async (req, res) => {
  try {
    // Validate request body
    const { value, error } = categorySchema.create.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({
      name: new RegExp(`^${value.name}$`, 'i')
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category already exists'
      });
    }

    // Create new category
    const category = new Category(value);
    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category: ' + error.message
    });
  }
});

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get single category by ID (Admin)
 * @access  Private/Admin
 */
router.get('/:id', verifyToken, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const productCount = await Product.countDocuments({
      category: category._id
    });

    const categoryData = {
      ...category.toJSON(),
      productCount
    };

    res.status(200).json({
      success: true,
      data: categoryData
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category: ' + error.message
    });
  }
});

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category (Admin)
 * @access  Private/Admin
 */
router.put('/:id', verifyToken, authorize('admin'), async (req, res) => {
  try {
    // Validate request body
    const { value, error } = categorySchema.update.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check if category exists
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if new name already exists (if name is being updated)
    if (value.name && value.name !== category.name) {
      const duplicateCategory = await Category.findOne({
        _id: { $ne: req.params.id },
        name: new RegExp(`^${value.name}$`, 'i')
      });

      if (duplicateCategory) {
        return res.status(409).json({
          success: false,
          message: 'Another category with this name already exists'
        });
      }
    }

    // Update category
    Object.assign(category, value);
    await category.save();

    const productCount = await Product.countDocuments({
      category: category._id
    });

    const updatedCategory = {
      ...category.toJSON(),
      productCount
    };

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category: ' + error.message
    });
  }
});

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category (Admin)
 * @access  Private/Admin
 */
router.delete('/:id', verifyToken, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get product count before deletion
    const productCount = await Product.countDocuments({
      category: category._id
    });

    // Delete category
    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Category deleted successfully. ${productCount} product(s) were affected.`,
      data: {
        deletedCategoryId: req.params.id,
        affectedProductCount: productCount
      }
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category: ' + error.message
    });
  }
});

module.exports = router;
