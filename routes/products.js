const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const { body } = require('express-validator'); // Import express-validator

// Validation rules for product creation
const productCreateValidation = [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('price').isNumeric().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('description').notEmpty().trim().withMessage('Description is required'),
    body('category').notEmpty().trim().withMessage('Category is required'),
    body('imageUrl').notEmpty().isURL().withMessage('Image URL is required'),
    body('countInStock').isInt({ min: 0 }).withMessage('Stock count cannot be negative'),
];

// Validation rules for product update (can be similar or adjusted)
const productUpdateValidation = [
    body('name').optional().trim(),
    body('price').optional().isNumeric().isFloat({ min: 0 }),
    body('description').optional().trim(),
    body('category').optional().trim(),
    body('imageUrl').optional().isURL(),
    body('countInStock').optional().isInt({ min: 0 }),
];

// Public access
router.get('/', productController.getAllProducts);
router.get('/:slug', productController.getProductBySlug);

// Admin and salesgirl only
router.post('/', verifyToken, authorizeRoles('admin', 'salesgirl'), productCreateValidation, productController.createProduct);
router.put('/:id', verifyToken, authorizeRoles('admin', 'salesgirl'), productUpdateValidation, productController.updateProduct);
router.delete('/:id', verifyToken, authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;