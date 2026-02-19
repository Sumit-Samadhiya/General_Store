const jwt = require('jsonwebtoken');

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId, role) => {
  const token = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
  return token;
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (userId) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
  return token;
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key'
    );
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key'
    );
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Generate password reset token
 */
const generateResetToken = (email) => {
  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '1h' }
  );
  return token;
};

/**
 * Verify reset token
 */
const verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key'
    );
    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateResetToken,
  verifyResetToken
};
