const mongoose = require('mongoose');

const CATEGORY_OPTIONS = ['kitchen', 'snacks', 'beauty', 'bakery', 'household'];
const WEIGHT_OPTIONS = ['100g', '250g', '500g', '1kg'];
const HOUSEHOLD_SIZE_OPTIONS = ['250ml', '500ml', '1L', '2L'];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [100, 'Product name must not exceed 100 characters']
    },
    brand: {
      type: String,
      required: [true, 'Please provide a brand'],
      trim: true,
      minlength: [2, 'Brand must be at least 2 characters'],
      maxlength: [100, 'Brand must not exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description must not exceed 1000 characters']
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true,
      lowercase: true,
      enum: {
        values: CATEGORY_OPTIONS,
        message: 'Please select a valid category'
      }
    },
    weight: {
      type: String,
      enum: {
        values: WEIGHT_OPTIONS,
        message: 'Please select a valid weight'
      },
      validate: {
        validator: function (value) {
          if (this.category === 'household') {
            return value === undefined || value === null || value === '';
          }
          return WEIGHT_OPTIONS.includes(value);
        },
        message: 'Weight is required for non-household categories'
      }
    },
    size: {
      type: String,
      enum: {
        values: HOUSEHOLD_SIZE_OPTIONS,
        message: 'Please select a valid size'
      },
      validate: {
        validator: function (value) {
          if (this.category === 'household') {
            return HOUSEHOLD_SIZE_OPTIONS.includes(value);
          }
          return value === undefined || value === null || value === '';
        },
        message: 'Size is required for household category'
      }
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: function (value) {
          return value > 0;
        },
        message: 'Price must be greater than 0'
      }
    },
    discountedPrice: {
      type: Number,
      min: [0, 'Discounted price cannot be negative'],
      validate: {
        validator: function (value) {
          if (value === undefined || value === null) return true;
          return value < this.price;
        },
        message: 'Discounted price must be less than original price'
      }
    },
    images: [
      {
        type: String,
        match: [
          /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i,
          'Please provide a valid image URL'
        ]
      }
    ],
    isAvailable: {
      type: Boolean,
      default: true
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Please provide a shop ID']
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
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ shopId: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
