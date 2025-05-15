const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');
const { body } = require('express-validator'); // Import express-validator

// Validation rules for registration
const registrationValidation = [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').trim().isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
];

// Validation rules for login
const loginValidation = [
    body('email').trim().isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Auth routes
router.post('/register', registrationValidation, authController.registerCustomer);
router.post('/login', loginValidation, authController.login);
router.post('/admin-login', loginValidation, authController.login); // Assuming same login logic
router.post('/salesgirl-login', loginValidation, authController.login); // Assuming same login logic

// 2FA
router.post('/verify-code', body('userId').notEmpty(), body('twoFACode').notEmpty(), authController.verifyCode);

// Password reset via SMS
router.post('/forgot-password', body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'), authController.forgotPassword);
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], authController.resetPassword);

// Authenticated user info
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;