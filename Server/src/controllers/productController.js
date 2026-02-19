const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get all available products with pagination, search, filtering, and sorting
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = -1 } = req.query;

    // Parse and validate pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    let filter = { isAvailable: true };

    // Apply search filter (name or description)
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Apply category filter
    if (category && category.trim()) {
      filter.category = category.trim();
    }

    // Apply price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        filter.price.$lte = parseFloat(maxPrice);
      }
    }

    // Build sort object
    let sortObj = {};
    if (sortBy) {
      const sortField = ['name', 'price', 'rating', 'createdAt'].includes(sortBy) ? sortBy : 'createdAt';
      sortObj[sortField] = parseInt(sortOrder) || -1;
    }

    // Execute queries
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('shopId', 'shopName ownerName email phone')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    const totalPages = Math.ceil(total / limitNum);

    return successResponse(res, {
      data: products,
      pagination: {
        currentPage: pageNum,
        pageSize: limitNum,
        totalProducts: total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }, 'Products retrieved successfully', 200);

  } catch (error) {
    console.error('Error in getAllProducts:', error);
    return errorResponse(res, 'Failed to retrieve products', 500, error.message);
  }
};

/**
 * Get single product details by ID
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid product ID format', 400);
    }

    const product = await Product.findById(id)
      .populate('shopId', 'shopName ownerName email phone address rating')
      .select('-__v');

    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    if (!product.isAvailable) {
      return errorResponse(res, 'This product is currently unavailable', 404);
    }

    return successResponse(res, product, 'Product details retrieved successfully', 200);

  } catch (error) {
    console.error('Error in getProductById:', error);
    return errorResponse(res, 'Failed to retrieve product', 500, error.message);
  }
};

/**
 * Get all available product categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isAvailable: true });

    if (!categories || categories.length === 0) {
      return successResponse(res, [], 'No categories available', 200);
    }

    // Sort categories alphabetically
    const sortedCategories = categories.sort();

    // Get count and price range for each category
    const categoryStats = await Promise.all(
      sortedCategories.map(async (cat) => {
        const stats = await Product.aggregate([
          { $match: { category: cat, isAvailable: true } },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              minPrice: { $min: '$price' },
              maxPrice: { $max: '$price' },
              avgPrice: { $avg: '$price' }
            }
          }
        ]);

        return {
          name: cat,
          count: stats[0]?.count || 0,
          minPrice: stats[0]?.minPrice || 0,
          maxPrice: stats[0]?.maxPrice || 0,
          avgPrice: Math.round(stats[0]?.avgPrice || 0)
        };
      })
    );

    return successResponse(res, categoryStats, 'Categories retrieved successfully', 200);

  } catch (error) {
    console.error('Error in getCategories:', error);
    return errorResponse(res, 'Failed to retrieve categories', 500, error.message);
  }
};

/**
 * Search products with advanced filters
 */
exports.searchProducts = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return errorResponse(res, 'Search query is required', 400);
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    let filter = {
      isAvailable: true,
      $or: [
        { name: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } }
      ]
    };

    if (category && category.trim()) {
      filter.category = category.trim();
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('shopId', 'shopName')
      .sort({ rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    const totalPages = Math.ceil(total / limitNum);

    return successResponse(res, {
      data: products,
      pagination: {
        currentPage: pageNum,
        pageSize: limitNum,
        totalProducts: total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }, `Found ${total} product(s)`, 200);

  } catch (error) {
    console.error('Error in searchProducts:', error);
    return errorResponse(res, 'Search failed', 500, error.message);
  }
};

/**
 * Get products by category
 */
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = -1 } = req.query;

    if (!category || category.trim().length === 0) {
      return errorResponse(res, 'Category is required', 400);
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    let sortObj = {};
    if (sortBy && ['name', 'price', 'rating', 'createdAt'].includes(sortBy)) {
      sortObj[sortBy] = parseInt(sortOrder) || -1;
    } else {
      sortObj.createdAt = -1;
    }

    const filter = { 
      category: { $regex: category.trim(), $options: 'i' }, 
      isAvailable: true 
    };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('shopId', 'shopName phone email')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    const totalPages = Math.ceil(total / limitNum);

    return successResponse(res, {
      data: products,
      pagination: {
        currentPage: pageNum,
        pageSize: limitNum,
        totalProducts: total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }, `Products in "${category}" category retrieved successfully`, 200);

  } catch (error) {
    console.error('Error in getProductsByCategory:', error);
    return errorResponse(res, 'Failed to retrieve products', 500, error.message);
  }
};

/**
 * Get products by shop
 */
exports.getProductsByShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = -1 } = req.query;

    if (!shopId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid shop ID format', 400);
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    let sortObj = {};
    if (sortBy && ['name', 'price', 'rating', 'createdAt'].includes(sortBy)) {
      sortObj[sortBy] = parseInt(sortOrder) || -1;
    } else {
      sortObj.createdAt = -1;
    }

    const filter = { 
      shopId: shopId,
      isAvailable: true 
    };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('shopId', 'shopName phone email address rating totalProducts')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    if (products.length === 0) {
      return errorResponse(res, 'No products found for this shop', 404);
    }

    const totalPages = Math.ceil(total / limitNum);

    return successResponse(res, {
      data: products,
      pagination: {
        currentPage: pageNum,
        pageSize: limitNum,
        totalProducts: total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }, 'Shop products retrieved successfully', 200);

  } catch (error) {
    console.error('Error in getProductsByShop:', error);
    return errorResponse(res, 'Failed to retrieve shop products', 500, error.message);
  }
};
