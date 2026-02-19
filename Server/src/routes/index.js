const express = require('express');
const router = express.Router();

/**
 * API Routes
 * Add your route files here
 */

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

module.exports = router;
