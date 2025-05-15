const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const { body } = require('express-validator'); // Import express-validator

// Validation rules for checkout
const checkoutValidation = [
    body('orderItems').isArray({ min: 1 }).withMessage('Order items must be a non-empty array'),
    body('orderItems.*.product').notEmpty().isMongoId().withMessage('Each order item must have a valid product ID'),
    body('orderItems.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('orderItems.*.selectedColor').notEmpty().withMessage('Color is required'),
    body('shippingAddress.fullName').notEmpty().trim().withMessage('Full name is required'),
    body('shippingAddress.address').notEmpty().trim().withMessage('Address is required'),
    body('shippingAddress.city').notEmpty().trim().withMessage('City is required'),
    body('shippingAddress.country').notEmpty().trim().withMessage('Country is required'),
    body('shippingAddress.phoneNumber').notEmpty().trim().withMessage('Phone number is required'),
    body('paymentMethod').isIn(['card', 'bank', 'bitcoin', 'usdt', 'ether', 'cashOnDelivery', 'paystack', 'stripe', 'crypto']).withMessage('Invalid payment method'),
    body('totalPrice').isNumeric().isFloat({ min: 0 }).withMessage('Total price must be a non-negative number'),
];

// Customers
router.post('/checkout', verifyToken, checkoutValidation, orderController.checkout);
router.get('/my-orders', verifyToken, orderController.getMyOrders);

// Admin & salesgirl
router.get('/all', verifyToken, authorizeRoles('admin', 'salesgirl'), orderController.getAllOrders);
router.put('/:id/status', verifyToken, authorizeRoles('admin', 'salesgirl'), body('status').notEmpty().trim(), orderController.updateOrderStatus);
router.post('/:id/refund', verifyToken, authorizeRoles('admin'), [
    body('refundAmount').isNumeric().isFloat({ min: 0 }).withMessage('Refund amount must be a non-negative number'),
    body('reason').notEmpty().trim().withMessage('Reason for refund is required'),
], orderController.processRefund);
router.put('/:id/deliver', verifyToken, authorizeRoles('admin', 'salesgirl'), orderController.updateOrderToDelivered);
router.get('/:orderId/invoice', verifyToken, orderController.generateInvoice);
router.put('/:orderId/return', verifyToken, body('action').isIn(['requested', 'approved', 'rejected']).withMessage('Invalid action'), orderController.handleReturnOrRefund);

module.exports = router;