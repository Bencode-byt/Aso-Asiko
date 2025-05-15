const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/auth');
const { body } = require('express-validator'); // Import express-validator

// Validation rules for profile update
const profileUpdateValidation = [
    body('username').optional().trim().notEmpty().withMessage('Username cannot be empty'),
    body('email').optional().trim().isEmail().withMessage('Invalid email address'),
    body('phoneNumber').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
    body('address').optional().trim(),
];

// Get own profile
router.get('/profile', verifyToken, userController.getUserProfile);

// Update profile
router.put('/profile', verifyToken, profileUpdateValidation, userController.updateUserProfile);

// Upload profile photo (if image upload is supported)
router.post('/upload-avatar', verifyToken, userController.uploadAvatar);

// Optional: delete own account
router.delete('/delete', verifyToken, userController.deleteOwnAccount);

module.exports = router;