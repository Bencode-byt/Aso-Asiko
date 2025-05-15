const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { verifyToken } = require("../middlewares/auth");
const { body } = require('express-validator'); // Import express-validator

// Validation rules for payment initialization
const paymentInitValidation = [
    body('email').trim().isEmail().withMessage('Invalid email address'),
    body('amount').isNumeric().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('orderId').notEmpty().isMongoId().withMessage('Valid order ID is required'),
];

// Validation rules for crypto payment
const cryptoPaymentValidation = [
    body('txHash').notEmpty().trim().withMessage('Transaction hash is required'),
    body('email').trim().isEmail().withMessage('Invalid email address'),
    body('amount').isNumeric().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('currency').notEmpty().trim().isIn(['USD', 'NGN', 'EUR', 'GBP', 'BTC', 'ETH', 'USDT']).withMessage('Invalid currency'),
    body('orderId').notEmpty().isMongoId().withMessage('Valid order ID is required'),
];

// ✅ Initialize Paystack Payment
router.post("/paystack", verifyToken, paymentInitValidation, paymentController.initializePaystackPayment);

// ✅ Create Stripe Payment Intent
router.post("/stripe", verifyToken, paymentInitValidation, paymentController.createStripePaymentIntent);

// ✅ Crypto Payment Confirmation
router.post("/crypto", verifyToken, cryptoPaymentValidation, paymentController.cryptoPayment);

// ✅ Payment Webhook (No authentication needed typically)
router.post("/webhook/:gateway", paymentController.handlePaymentWebhook); // Added gateway parameter

// ✅ Initiate Payment (Generic - May be redundant)
router.post("/initiate", verifyToken, body('orderId').notEmpty().isMongoId(), paymentController.initiatePayment);

module.exports = router;