const mongoose = require('mongoose');
const { Product, Shop, User } = require('../models');

// Image URLs from Unsplash that match the regex pattern (must end with image extension)
const IMAGE_URLS = {
  'Stainless Steel Mixing Bowl Set': 'https://images.unsplash.com/photo-1578500494198-246f612d0b3d.jpg',
  'Premium Tea Collection': 'https://images.unsplash.com/photo-1597318972826-87db08c9d4a9.jpg',
  'Organic Moisturizing Cream': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883.jpg',
  'Artisan Chocolate Cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587.jpg',
  'Eco-Friendly Dish Soap': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd.jpg',
  'Silicone Baking Mat Set': 'https://images.unsplash.com/photo-1594618318286-a5a099b8ffe0.jpg',
  'Almonds (Raw)': 'https://images.unsplash.com/photo-1599599810694-86a37b7f5c34.jpg',
  'Vitamin C Serum': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883.jpg',
  'Whole Wheat Bread': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93.jpg',
  'All-Purpose Cleaner': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd.jpg',
  'Knife Set (6 Piece)': 'https://images.unsplash.com/photo-1593618998160-e34014e67546.jpg',
  'Organic Coffee Beans': 'https://images.unsplash.com/photo-1559056199-641a0ac8b3f7.jpg'
};

const SAMPLE_PRODUCTS = [
  {
    name: 'Stainless Steel Mixing Bowl Set',
    brand: 'HomeChef',
    description: 'Set of 3 non-slip mixing bowls made from premium stainless steel',
    category: 'kitchen',
    weight: '500g',
    price: 899,
    discountedPrice: 749,
    isAvailable: true
  },
  {
    name: 'Premium Tea Collection',
    brand: 'GoldenLeaf',
    description: 'Assorted premium tea blends including green, black, and herbal teas',
    category: 'snacks',
    weight: '250g',
    price: 599,
    discountedPrice: 499,
    isAvailable: true
  },
  {
    name: 'Organic Moisturizing Cream',
    brand: 'NaturalGlow',
    description: '100% organic face cream with natural ingredients for all skin types',
    category: 'beauty',
    weight: '100g',
    price: 1299,
    discountedPrice: null,
    isAvailable: true
  },
  {
    name: 'Artisan Chocolate Cake',
    brand: 'BakeryBliss',
    description: 'Handmade chocolate cake made with Belgian chocolate and fresh eggs',
    category: 'bakery',
    weight: '500g',
    price: 449,
    discountedPrice: 399,
    isAvailable: true
  },
  {
    name: 'Eco-Friendly Dish Soap',
    brand: 'EcoClean',
    description: 'Plant-based dish soap that is biodegradable and safe for families',
    category: 'household',
    size: '500ml',
    price: 179,
    discountedPrice: null,
    isAvailable: true
  },
  {
    name: 'Silicone Baking Mat Set',
    brand: 'HomeChef',
    description: 'Non-stick silicone baking mats, reusable and easy to clean',
    category: 'kitchen',
    weight: '1kg',
    price: 349,
    discountedPrice: 299,
    isAvailable: true
  },
  {
    name: 'Almonds (Raw)',
    brand: 'NutryPro',
    description: 'Raw, unsalted almonds sourced from California',
    category: 'snacks',
    weight: '250g',
    price: 649,
    discountedPrice: 599,
    isAvailable: true
  },
  {
    name: 'Vitamin C Serum',
    brand: 'BrightSkin',
    description: 'High potency vitamin C serum for brightening and anti-aging',
    category: 'beauty',
    weight: '100g',
    price: 1499,
    discountedPrice: 1299,
    isAvailable: true
  },
  {
    name: 'Whole Wheat Bread',
    brand: 'BakeryBliss',
    description: 'Fresh whole wheat bread made daily with no preservatives',
    category: 'bakery',
    weight: '500g',
    price: 79,
    discountedPrice: null,
    isAvailable: true
  },
  {
    name: 'All-Purpose Cleaner',
    brand: 'EcoClean',
    description: 'Powerful yet gentle all-purpose cleaning spray for all surfaces',
    category: 'household',
    size: '1L',
    price: 249,
    discountedPrice: 199,
    isAvailable: true
  },
  {
    name: 'Knife Set (6 Piece)',
    brand: 'SharpEdge',
    description: 'Professional grade knife set with ergonomic handles',
    category: 'kitchen',
    weight: '1kg',
    price: 2499,
    discountedPrice: 1999,
    isAvailable: true
  },
  {
    name: 'Organic Coffee Beans',
    brand: 'CafeFresh',
    description: 'Single-origin organic coffee beans, freshly roasted',
    category: 'snacks',
    weight: '250g',
    price: 799,
    discountedPrice: 699,
    isAvailable: true
  }
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/general_store', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Create or find a default shop owner user
    let owner = await User.findOne({ email: 'shopowner@generalstore.com' });
    
    if (!owner) {
      owner = await User.create({
        name: 'Shop Admin',
        email: 'shopowner@generalstore.com',
        password: 'password123',
        role: 'customer',
        phone: '9876543210',
        isActive: true
      });
      console.log('Created new shop owner user:', owner._id);
    } else {
      console.log('Using existing shop owner user:', owner._id);
    }

    // Create or find a default shop
    let shop = await Shop.findOne({ shopName: 'General Store' });
    
    if (!shop) {
      shop = await Shop.create({
        shopName: 'General Store',
        ownerName: 'Shop Admin',
        email: 'store@generalstore.com',
        phone: '9876543210',
        address: {
          street: '123 Commerce Street',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India'
        },
        type: 'general',
        ownerId: owner._id
      });
      console.log('Created new shop:', shop._id);
    } else {
      console.log('Using existing shop:', shop._id);
    }

    // Insert sample products with shopId
    const productsWithShop = SAMPLE_PRODUCTS.map(product => ({
      ...product,
      shopId: shop._id,
      images: [IMAGE_URLS[product.name] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&fm=jpg']
    }));

    const createdProducts = await Product.insertMany(productsWithShop);
    console.log(`✅ Successfully seeded ${createdProducts.length} products`);

    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

// Run the seed function
seedProducts();
