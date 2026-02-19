const { Product, Shop } = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Create new product
 * POST /api/admin/products
 */
const createProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      description,
      category,
      weight,
      size,
      price,
      discountedPrice,
      images,
      shopId,
      isAvailable
    } = req.validatedBody;

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json(
        errorResponse('Shop not found', 404)
      );
    }

    // Verify admin owns the shop or is super admin
    if (shop.ownerId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json(
        errorResponse('Not authorized to add products to this shop', 403)
      );
    }

    // Create product
    const product = new Product({
      name,
      brand,
      description,
      category: category.toLowerCase(),
      weight,
      size,
      price,
      discountedPrice,
      images: images || [],
      shopId,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    await product.save();

    // Update shop's totalProducts count
    await Shop.findByIdAndUpdate(
      shopId,
      { $inc: { totalProducts: 1 } }
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json(
      errorResponse('Error creating product', 500, error.message)
    );
  }
};

/**
 * Get all products for admin (with pagination, search, filter)
 * GET /api/admin/products
 */
const getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      minPrice, 
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = -1
    } = req.query;

    const skip = (page - 1) * limit;
    const pageNum = parseInt(page);
    const pageLimit = parseInt(limit);
    const sortOrderNum = parseInt(sortOrder);

    // Build filter
    let filter = {};

    // Filter by shop if user is shop owner
    if (req.user.role !== 'admin') {
      const shop = await Shop.findOne({ ownerId: req.user.userId });
      if (!shop) {
        return res.status(404).json(
          errorResponse('Shop not found', 404)
        );
      }
      filter.shopId = shop._id;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category.toLowerCase();
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrderNum;

    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / pageLimit);

    // Get products
    const products = await Product.find(filter)
      .populate('shopId', 'shopName')
      .sort(sortObject)
      .skip(skip)
      .limit(pageLimit);

    res.json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      pagination: {
        currentPage: pageNum,
        pageSize: pageLimit,
        totalProducts: total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json(
      errorResponse('Error retrieving products', 500, error.message)
    );
  }
};

/**
 * Get single product details
 * GET /api/admin/products/:id
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('shopId');

    if (!product) {
      return res.status(404).json(
        errorResponse('Product not found', 404)
      );
    }

    // Verify authorization
    if (req.user.role !== 'admin') {
      const shop = await Shop.findById(product.shopId);
      if (shop.ownerId.toString() !== req.user.userId) {
        return res.status(403).json(
          errorResponse('Not authorized to view this product', 403)
        );
      }
    }

    res.json({
      success: true,
      message: 'Product retrieved successfully',
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json(
      errorResponse('Error retrieving product', 500, error.message)
    );
  }
};

/**
 * Update product
 * PUT /api/admin/products/:id
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('shopId');

    if (!product) {
      return res.status(404).json(
        errorResponse('Product not found', 404)
      );
    }

    // Verify authorization
    if (req.user.role !== 'admin') {
      if (product.shopId.ownerId.toString() !== req.user.userId) {
        return res.status(403).json(
          errorResponse('Not authorized to update this product', 403)
        );
      }
    }

    // Update allowed fields
    const allowedFields = [
      'name',
      'brand',
      'description',
      'category',
      'weight',
      'size',
      'price',
      'discountedPrice',
      'images',
      'isAvailable'
    ];

    const updates = {};
    Object.keys(req.validatedBody).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'category') {
          updates[key] = req.validatedBody[key].toLowerCase();
        } else {
          updates[key] = req.validatedBody[key];
        }
      }
    });

    updates.updatedAt = new Date();

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json(
      errorResponse('Error updating product', 500, error.message)
    );
  }
};

/**
 * Soft delete product
 * DELETE /api/admin/products/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('shopId');

    if (!product) {
      return res.status(404).json(
        errorResponse('Product not found', 404)
      );
    }

    // Verify authorization
    if (req.user.role !== 'admin') {
      if (product.shopId.ownerId.toString() !== req.user.userId) {
        return res.status(403).json(
          errorResponse('Not authorized to delete this product', 403)
        );
      }
    }

    // Soft delete - mark as unavailable instead of removing
    product.isAvailable = false;
    product.updatedAt = new Date();
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully (soft delete)',
      data: product
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json(
      errorResponse('Error deleting product', 500, error.message)
    );
  }
};

/**
 * Bulk update products (e.g., bulk price adjustment)
 * PATCH /api/admin/products/bulk/update
 */
const bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updates } = req.validatedBody;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json(
        errorResponse('Product IDs array is required', 400)
      );
    }

    // Get all products to verify authorization
    const products = await Product.find({ _id: { $in: productIds } }).populate('shopId');

    if (products.length === 0) {
      return res.status(404).json(
        errorResponse('No products found', 404)
      );
    }

    // Verify authorization for all products
    for (const product of products) {
      if (req.user.role !== 'admin') {
        if (product.shopId.ownerId.toString() !== req.user.userId) {
          return res.status(403).json(
            errorResponse('Not authorized to update all selected products', 403)
          );
        }
      }
    }

    // Update all products
    const updateData = { ...updates, updatedAt: new Date() };
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      updateData
    );

    res.json({
      success: true,
      message: 'Products updated successfully',
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json(
      errorResponse('Error updating products', 500, error.message)
    );
  }
};

/**
 * Get product statistics
 * GET /api/admin/products/stats/overview
 */
const getProductStats = async (req, res) => {
  try {
    let shopFilter = {};

    // Filter by shop if user is shop owner
    if (req.user.role !== 'admin') {
      const shop = await Shop.findOne({ ownerId: req.user.userId });
      if (!shop) {
        return res.status(404).json(
          errorResponse('Shop not found', 404)
        );
      }
      shopFilter.shopId = shop._id;
    }

    // Get statistics
    const totalProducts = await Product.countDocuments(shopFilter);
    const availableProducts = await Product.countDocuments({
      ...shopFilter,
      isAvailable: true
    });
    const unavailableProducts = await Product.countDocuments({
      ...shopFilter,
      isAvailable: false
    });

    const stats = await Product.aggregate([
      { $match: shopFilter },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$price' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    const categoryStats = await Product.aggregate([
      { $match: shopFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      message: 'Product statistics retrieved',
      data: {
        summary: {
          totalProducts,
          availableProducts,
          unavailableProducts
        },
        aggregate: stats[0] || {
          totalValue: 0,
          avgPrice: 0,
          minPrice: 0,
          maxPrice: 0
        },
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json(
      errorResponse('Error retrieving statistics', 500, error.message)
    );
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
  getProductStats
};
