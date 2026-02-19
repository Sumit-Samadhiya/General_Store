const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be an integer'
    }
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  items: [cartItemSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: { expireAfterSeconds: 0 } // TTL index for auto-deletion
  }
}, {
  timestamps: true
});

// Calculate total before saving
cartSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity, price) {
  const existingItem = this.items.find(item => item.productId.toString() === productId.toString());
  
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.addedAt = Date.now();
  } else {
    this.items.push({
      productId,
      quantity,
      price,
      addedAt: Date.now()
    });
  }
  
  return this;
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId.toString());
  return this;
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.find(item => item._id.toString() === itemId.toString());
  if (item) {
    item.quantity = quantity;
  }
  return this;
};

// Method to get cart total
cartSchema.methods.getTotal = function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Method to get item count
cartSchema.methods.getItemCount = function() {
  return this.items.reduce((count, item) => count + item.quantity, 0);
};

// Static method to get or create cart
cartSchema.statics.getOrCreate = async function(userId) {
  let cart = await this.findOne({ userId });
  if (!cart) {
    cart = new this({ userId, items: [] });
    await cart.save();
  }
  return cart;
};

module.exports = mongoose.model('Cart', cartSchema);
