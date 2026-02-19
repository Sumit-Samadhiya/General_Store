const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a customer ID']
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: [true, 'Please provide a product ID']
        },
        productName: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: [true, 'Please provide quantity'],
          min: [1, 'Quantity must be at least 1']
        },
        price: {
          type: Number,
          required: [true, 'Please provide price'],
          min: [0, 'Price cannot be negative']
        },
        shopId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Shop',
          required: true
        },
        subtotal: {
          type: Number,
          required: true
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: [true, 'Please provide total amount'],
      min: [0, 'Total amount cannot be negative']
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'],
        message: 'Please select a valid status'
      },
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'failed', 'refunded'],
        message: 'Please select a valid payment status'
      },
      default: 'pending'
    },
    deliveryAddress: {
      name: {
        type: String,
        required: [true, 'Please provide recipient name'],
        minlength: [2, 'Name must be at least 2 characters']
      },
      phone: {
        type: String,
        required: [true, 'Please provide phone number'],
        match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number']
      },
      email: {
        type: String,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please provide a valid email'
        ]
      },
      street: {
        type: String,
        required: [true, 'Please provide street address']
      },
      city: {
        type: String,
        required: [true, 'Please provide city']
      },
      state: {
        type: String,
        required: [true, 'Please provide state']
      },
      zipCode: {
        type: String,
        required: [true, 'Please provide zip code'],
        match: [/^\d{5,6}$/, 'Please provide a valid zip code']
      },
      country: {
        type: String,
        default: 'India'
      }
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes must not exceed 500 characters']
    },
    trackingNumber: {
      type: String,
      sparse: true
    },
    estimatedDeliveryDate: {
      type: Date
    },
    actualDeliveryDate: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'products.shopId': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
