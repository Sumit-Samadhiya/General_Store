const { User } = require('../models');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
  verifyResetToken
} = require('../utils/tokenManager');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(
        errorResponse('Email already registered', 400)
      );
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      role: role || 'customer'
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(
      errorResponse('Registration failed', 500, error.message)
    );
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json(
        errorResponse('Email and password are required', 400)
      );
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json(
        errorResponse('Invalid email or password', 401)
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json(
        errorResponse('Invalid email or password', 401)
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json(
        errorResponse('User account is inactive', 403)
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(
      errorResponse('Login failed', 500, error.message)
    );
  }
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json(
        errorResponse('Refresh token is required', 400)
      );
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json(
        errorResponse('Invalid or expired refresh token', 401)
      );
    }

    // Get user
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json(
        errorResponse('Refresh token not found or invalid', 401)
      );
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json(
      errorResponse('Token refresh failed', 500, error.message)
    );
  }
};

/**
 * Request password reset
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(
        errorResponse('Email is required', 400)
      );
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        success: true,
        message: 'If email exists, password reset link will be sent'
      });
    }

    // Generate reset token
    const resetToken = generateResetToken(email);

    // Save reset token to user (optional - for tracking)
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    await user.save();

    // Construct reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Send email
    await sendPasswordResetEmail(email, resetToken, resetLink);

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to email'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json(
      errorResponse('Password reset request failed', 500, error.message)
    );
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json(
        errorResponse('Token and new password are required', 400)
      );
    }

    // Verify reset token
    const decoded = verifyResetToken(token);

    if (!decoded) {
      return res.status(401).json(
        errorResponse('Invalid or expired reset token', 401)
      );
    }

    // Find user by email
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json(
        errorResponse('User not found', 404)
      );
    }

    // Validate password
    if (newPassword.length < 6) {
      return res.status(400).json(
        errorResponse('Password must be at least 6 characters', 400)
      );
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json(
      errorResponse('Password reset failed', 500, error.message)
    );
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json(
        errorResponse('User not authenticated', 401)
      );
    }

    // Clear refresh token from database
    const user = await User.findById(userId);
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json(
      errorResponse('Logout failed', 500, error.message)
    );
  }
};

/**
 * Get current user profile
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json(
        errorResponse('User not authenticated', 401)
      );
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json(
        errorResponse('User not found', 404)
      );
    }

    res.status(200).json(
      successResponse(user, 'User profile retrieved successfully')
    );
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json(
      errorResponse('Failed to retrieve user profile', 500, error.message)
    );
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  requestPasswordReset,
  resetPassword,
  logout,
  getCurrentUser
};
