/**
 * Helper utility functions
 */

/**
 * Format success response
 */
const successResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    statusCode,
    message,
    data
  };
};

/**
 * Format error response
 */
const errorResponse = (message = 'Error', statusCode = 400, errors = null) => {
  return {
    success: false,
    statusCode,
    message,
    ...(errors && { errors })
  };
};

/**
 * Generate a random string
 */
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = {
  successResponse,
  errorResponse,
  generateRandomString
};
