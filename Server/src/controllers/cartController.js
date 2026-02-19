const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Add item to cart
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id || req.user._id;

    // Validate input
    if (!productId || !quantity) {
      return errorResponse(res, 'Product ID and quantity are required', 400);
    }

    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid product ID format', 400);
    }

    const quantityNum = parseInt(quantity);
    if (!Number.isInteger(quantityNum) || quantityNum < 1) {
      return errorResponse(res, 'Quantity must be a positive integer', 400);
    }

    // Check product existence and availability
    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    if (!product.isAvailable) {
      return errorResponse(res, 'Product is not available', 400);
    }

    // Get or create cart
    let cart = await Cart.getOrCreate(userId);

    // Add item to cart
    cart.addItem(productId, quantityNum, product.price);

    // Save cart
    await cart.save();

    // Populate product details
    await cart.populate('items.productId', 'name brand price');

    return successResponse(res, {
      cart: {
        itemCount: cart.getItemCount(),
        total: cart.getTotal(),
        items: cart.items.map(item => ({
          _id: item._id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
          addedAt: item.addedAt
        }))
      }
    }, 'Item added to cart successfully', 200);

  } catch (error) {
    console.error('Error in addToCart:', error);
    return errorResponse(res, 'Failed to add item to cart', 500, error.message);
  }
};

/**
 * Get user's cart
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // Get cart
    let cart = await Cart.findOne({ userId })
      .populate('items.productId', 'name brand description price images category weight size shopId');

    if (!cart) {
      cart = await Cart.getOrCreate(userId);
    }

    // Map cart items with product details
    const cartData = {
      _id: cart._id,
      userId: cart.userId,
      items: cart.items.map(item => ({
        _id: item._id,
        product: {
          _id: item.productId?._id,
          name: item.productId?.name,
          description: item.productId?.description,
          images: item.productId?.images,
          category: item.productId?.category
        },
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        addedAt: item.addedAt
      })),
      itemCount: cart.getItemCount(),
      total: cart.getTotal(),
      lastUpdated: cart.lastUpdated,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    };

    return successResponse(res, cartData, 'Cart retrieved successfully', 200);

  } catch (error) {
    console.error('Error in getCart:', error);
    return errorResponse(res, 'Failed to retrieve cart', 500, error.message);
  }
};

/**
 * Update cart item quantity
 */
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id || req.user._id;

    // Validate input
    if (!itemId || !itemId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid item ID format', 400);
    }

    if (quantity === undefined || quantity === null) {
      return errorResponse(res, 'Quantity is required', 400);
    }

    const quantityNum = parseInt(quantity);
    if (!Number.isInteger(quantityNum) || quantityNum < 1) {
      return errorResponse(res, 'Quantity must be a positive integer', 400);
    }

    // Get cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return errorResponse(res, 'Cart not found', 404);
    }

    // Find cart item
    const cartItem = cart.items.find(item => item._id.toString() === itemId.toString());
    if (!cartItem) {
      return errorResponse(res, 'Item not found in cart', 404);
    }

    // Check availability
    const product = await Product.findById(cartItem.productId);
    if (!product || !product.isAvailable) {
      return errorResponse(res, 'Product is no longer available', 400);
    }

    // Update quantity
    cart.updateItemQuantity(itemId, quantityNum);
    await cart.save();

    // Populate product details
    await cart.populate('items.productId', 'name brand price');

    return successResponse(res, {
      cart: {
        itemCount: cart.getItemCount(),
        total: cart.getTotal(),
        items: cart.items.map(item => ({
          _id: item._id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
          addedAt: item.addedAt
        }))
      }
    }, 'Cart item updated successfully', 200);

  } catch (error) {
    console.error('Error in updateCartItem:', error);
    return errorResponse(res, 'Failed to update cart item', 500, error.message);
  }
};

/**
 * Remove item from cart
 */
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id || req.user._id;

    // Validate input
    if (!itemId || !itemId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid item ID format', 400);
    }

    // Get cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return errorResponse(res, 'Cart not found', 404);
    }

    // Check if item exists
    const itemExists = cart.items.some(item => item._id.toString() === itemId.toString());
    if (!itemExists) {
      return errorResponse(res, 'Item not found in cart', 404);
    }

    // Remove item
    cart.removeItem(itemId);
    await cart.save();

    // Populate product details
    await cart.populate('items.productId', 'name brand price');

    return successResponse(res, {
      cart: {
        itemCount: cart.getItemCount(),
        total: cart.getTotal(),
        items: cart.items.map(item => ({
          _id: item._id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
          addedAt: item.addedAt
        }))
      }
    }, 'Item removed from cart successfully', 200);

  } catch (error) {
    console.error('Error in removeFromCart:', error);
    return errorResponse(res, 'Failed to remove item from cart', 500, error.message);
  }
};

/**
 * Clear entire cart
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return errorResponse(res, 'Cart not found', 404);
    }

    cart.items = [];
    await cart.save();

    return successResponse(res, {
      cart: {
        itemCount: 0,
        total: 0,
        items: []
      }
    }, 'Cart cleared successfully', 200);

  } catch (error) {
    console.error('Error in clearCart:', error);
    return errorResponse(res, 'Failed to clear cart', 500, error.message);
  }
};

/**
 * Get cart summary
 */
exports.getCartSummary = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return successResponse(res, {
        itemCount: 0,
        total: 0,
        isEmpty: true
      }, 'Cart is empty', 200);
    }

    return successResponse(res, {
      itemCount: cart.getItemCount(),
      total: cart.getTotal(),
      items: cart.items.length,
      isEmpty: cart.items.length === 0
    }, 'Cart summary retrieved successfully', 200);

  } catch (error) {
    console.error('Error in getCartSummary:', error);
    return errorResponse(res, 'Failed to retrieve cart summary', 500, error.message);
  }
};
