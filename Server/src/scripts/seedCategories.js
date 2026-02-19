const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('../models/Category.js');
const { log } = require('../utils/logger');

const categories = [
  {
    name: 'Kitchen',
    description: 'Kitchen appliances, tools, and accessories for cooking and food preparation'
  },
  {
    name: 'Snacks',
    description: 'Delicious snacks, chips, and ready-to-eat food items'
  },
  {
    name: 'Beauty',
    description: 'Beauty and skincare products for personal grooming'
  },
  {
    name: 'Bakery',
    description: 'Fresh bakery items, breads, pastries, and baked goods'
  },
  {
    name: 'Household',
    description: 'Household essentials and cleaning supplies'
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    const mongoURL = process.env.MONGODB_URI || 'mongodb://localhost:27017/general_store';
    await mongoose.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    log.info('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    log.info('Cleared existing categories');

    // Insert categories
    const result = await Category.insertMany(categories);
    log.info(`Seeded ${result.length} categories successfully`);

    // Display seeded categories
    const allCategories = await Category.find({});
    console.log('\nSeeded Categories:');
    console.table(allCategories.map(cat => ({
      id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description
    })));

    process.exit(0);
  } catch (error) {
    log.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
