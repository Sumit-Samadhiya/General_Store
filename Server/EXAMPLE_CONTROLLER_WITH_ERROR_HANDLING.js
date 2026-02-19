/**
 * Example Controller with Comprehensive Error Handling
 * This demonstrates how to use the new error handling system
 *
 * Copy this pattern to update existing controllers
 */

const { asyncHandler } = require('../middleware/errorHandler');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
  DatabaseError
} = require('../utils/customErrors');
const ApiResponse = require('../utils/apiResponse');
const { log } = require('../utils/logger');

// ============================================================================
// EXAMPLE 1: Create Resource (POST)
// ============================================================================

/**
 * Create a new user
 * POST /api/v1/users
 * Body: { name, email, password }
 */
exports.createUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ Validate inputs
    if (!name || !email || !password) {
      throw new ValidationError('Missing required fields', [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' }
      ]);
    }

    // ✅ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format', [
        { field: 'email', message: 'Please provide a valid email address' }
      ]);
    }

    // ✅ Validate password strength
    if (password.length < 8) {
      throw new ValidationError('Password too short', [
        { field: 'password', message: 'Password must be at least 8 characters' }
      ]);
    }

    // ✅ Check for duplicate
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError(`Email ${email} is already registered`);
    }

    // ✅ Hash password and create user
    const user = await User.create({ name, email, password });

    // ✅ Log successful creation
    log.info('User created successfully', {
      userId: user._id,
      email: user.email
    });

    // ✅ Return created response (201)
    ApiResponse.created(res, 'User created successfully', {
      id: user._id,
      name: user.name,
      email: user.email
    });

  } catch (error) {
    // Catch block is optional with asyncHandler, but can add custom logging here
    log.error('Failed to create user', error, { email: req.body.email });
    throw error; // Re-throw to pass to global error handler
  }
});

// ============================================================================
// EXAMPLE 2: Get Single Resource (GET)
// ============================================================================

/**
 * Get user by ID
 * GET /api/v1/users/:id
 */
exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // ✅ Validate ID format
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ValidationError('Invalid user ID format', [
      { field: 'id', message: 'ID must be a valid MongoDB ObjectId' }
    ]);
  }

  // ✅ Query database
  const user = await User.findById(id).select('-password');

  // ✅ Check if resource exists
  if (!user) {
    throw new NotFoundError('User');
  }

  // ✅ Log successful retrieval
  log.info('User retrieved', { userId: id });

  // ✅ Return success response
  ApiResponse.success(res, 200, 'User retrieved successfully', user);
});

// ============================================================================
// EXAMPLE 3: List Resources with Pagination (GET)
// ============================================================================

/**
 * List all users with pagination
 * GET /api/v1/users?page=1&limit=10&search=john
 */
exports.listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
  const search = req.query.search || '';

  // ✅ Build query
  let query = {};
  if (search) {
    query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    };
  }

  // ✅ Execute query with pagination
  const skip = (page - 1) * limit;
  const users = await User.find(query)
    .select('-password')
    .skip(skip)
    .limit(limit)
    .lean();

  // ✅ Get total count
  const total = await User.countDocuments(query);

  // ✅ Log list retrieval
  log.info('Users list retrieved', {
    page,
    limit,
    total,
    returned: users.length
  });

  // ✅ Return paginated response
  ApiResponse.paginated(res, 200, 'Users retrieved successfully', users, total, page, limit);
});

// ============================================================================
// EXAMPLE 4: Update Resource (PATCH/PUT)
// ============================================================================

/**
 * Update user
 * PATCH /api/v1/users/:id
 * Body: { name?, email?, phone? }
 */
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  // ✅ Authorization check - user can only update their own profile
  if (req.user.id !== id && req.user.role !== 'admin') {
    throw new AuthorizationError('You can only update your own profile');
  }

  // ✅ Validate input
  if (!name && !email && !phone) {
    throw new ValidationError('At least one field must be provided for update', [
      { field: 'body', message: 'Provide name, email, or phone to update' }
    ]);
  }

  // ✅ Check email uniqueness if updating email
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format', [
        { field: 'email', message: 'Please provide a valid email address' }
      ]);
    }

    const existingUser = await User.findOne({ email, _id: { $ne: id } });
    if (existingUser) {
      throw new ConflictError('Email is already in use');
    }
  }

  // ✅ Build update object
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;

  // ✅ Update user
  const user = await User.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  // ✅ Check if user exists
  if (!user) {
    throw new NotFoundError('User');
  }

  // ✅ Log update
  log.info('User updated successfully', {
    userId: id,
    updates: Object.keys(updateData)
  });

  // ✅ Return updated resource
  ApiResponse.success(res, 200, 'User updated successfully', user);
});

// ============================================================================
// EXAMPLE 5: Delete Resource (DELETE)
// ============================================================================

/**
 * Delete user
 * DELETE /api/v1/users/:id
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // ✅ Authorization check
  if (req.user.id !== id && req.user.role !== 'admin') {
    throw new AuthorizationError('You can only delete your own account');
  }

  // ✅ Find and delete user
  const user = await User.findByIdAndDelete(id);

  // ✅ Check if user exists
  if (!user) {
    throw new NotFoundError('User');
  }

  // ✅ Log deletion
  log.info('User deleted successfully', {
    userId: id,
    email: user.email
  });

  // ✅ Return no content response (204)
  ApiResponse.noContent(res);
});

// ============================================================================
// EXAMPLE 6: Complex Business Logic
// ============================================================================

/**
 * Process user order
 * POST /api/v1/users/:userId/orders
 * Body: { items: [{ productId, quantity }] }
 */
exports.createOrder = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { items } = req.body;

  // ✅ Validate input
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Invalid order items', [
      { field: 'items', message: 'Must provide at least one item' }
    ]);
  }

  // ✅ Authorization check
  if (req.user.id !== userId && req.user.role !== 'admin') {
    throw new AuthorizationError('Cannot create orders for other users');
  }

  // ✅ Check user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  // ✅ Validate items and get prices
  let totalPrice = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);

    // ✅ Check product exists
    if (!product) {
      throw new NotFoundError(`Product ${item.productId}`);
    }

    // ✅ Check stock availability
    if (product.stock < item.quantity) {
      throw new ValidationError('Insufficient stock', [
        {
          field: 'items',
          message: `${product.name} has only ${product.stock} in stock`
        }
      ]);
    }

    totalPrice += product.price * item.quantity;
    orderItems.push({
      productId: product._id,
      quantity: item.quantity,
      price: product.price
    });
  }

  // ✅ Check user has sufficient balance
  if (user.balance < totalPrice) {
    throw new ValidationError('Insufficient balance', [
      {
        field: 'balance',
        message: `Your balance is $${user.balance}, but total is $${totalPrice}`
      }
    ]);
  }

  try {
    // ✅ Start transaction (if using MongoDB sessions)
    const session = await User.startSession();
    session.startTransaction();

    // ✅ Create order
    const order = await Order.create(
      [{
        userId,
        items: orderItems,
        totalPrice,
        status: 'pending'
      }],
      { session }
    );

    // ✅ Update stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    // ✅ Deduct balance
    user.balance -= totalPrice;
    await user.save({ session });

    // ✅ Commit transaction
    await session.commitTransaction();
    session.endSession();

    // ✅ Log order creation
    log.info('Order created successfully', {
      userId,
      orderId: order[0]._id,
      totalPrice,
      itemCount: items.length
    });

    // ✅ Return created order
    ApiResponse.created(res, 'Order created successfully', {
      orderId: order[0]._id,
      totalPrice: order[0].totalPrice,
      items: order[0].items
    });

  } catch (error) {
    // ✅ Handle database errors specifically
    if (error.name === 'MongoError') {
      throw new DatabaseError('Failed to process order: ' + error.message);
    }
    throw error;
  }
});

// ============================================================================
// EXAMPLE 7: Binary Response (Download/Stream)
// ============================================================================

/**
 * Download user data as PDF
 * GET /api/v1/users/:id/export
 */
exports.exportUserData = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // ✅ Get user data
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User');
  }

  // ✅ Check authorization
  if (req.user.id !== id && req.user.role !== 'admin') {
    throw new AuthorizationError('Cannot export other users\' data');
  }

  // ✅ Generate PDF (example)
  const pdf = await generatePdf(user);

  // ✅ Log export
  log.info('User data exported', { userId: id });

  // ✅ Send file
  res.contentType('application/pdf');
  res.send(pdf);
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  createUser,
  getUserById,
  listUsers,
  updateUser,
  deleteUser,
  createOrder,
  exportUserData
};

/**
 * KEY PATTERNS USED:
 *
 * 1. asyncHandler wraps async handlers to catch errors automatically
 * 2. Validation is done first with specific error messages
 * 3. Database queries check if resources exist
 * 4. Authorization checks ensure users can only access their own data
 * 5. Specific error classes used instead of generic Error
 * 6. Logging includes relevant context (IDs, emails, changes)
 * 7. ApiResponse methods vary by use case (created, success, noContent, paginated)
 * 8. Error messages are clear and actionable for API consumers
 *
 * NEXT STEPS:
 * 1. Copy this pattern to your existing controllers
 * 2. Replace res.json() with ApiResponse.* methods
 * 3. Replace throw new Error() with specific error classes
 * 4. Add logging with log.info(), log.error(), etc.
 * 5. Test error scenarios
 * 6. Monitor logs in logs/ directory
 */
