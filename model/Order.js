const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        orderItems: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                selectedColor: {
                    type: String,
                    required: true,
                },
                // Add other variants if needed in the future
            },
        ],
        shippingAddress: {
            fullName: { type: String, required: true },
            address: { type: String, required: true },
            city: { type: String, required: true },
            postalCode: { type: String },
            country: { type: String, required: true },
            phoneNumber: { type: String, required: true }, // Consistent naming
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ["card", "bank", "bitcoin", "usdt", "ether", "cashOnDelivery", "paystack", "stripe", "crypto"], // Added payment gateways
        },
        paymentResult: {
            transactionId: { type: String },
            status: { type: String },
            paymentDate: { type: Date },
            currency: { type: String },
            exchangeRate: { type: Number },
            amount: { type: Number }, // Added amount for crypto
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        isPaid: {
            type: Boolean,
            default: false,
        },
        paidAt: Date,
        isDelivered: {
            type: Boolean,
            default: false,
        },
        deliveredAt: Date,
        deliveryETA: {
            type: Date,
        },
        deliveryStatus: {
            type: String,
            default: "processing",
        },
        statusHistory: [
            {
                status: String,
                updatedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        invoiceRef: {
            type: String,
            unique: true,
            sparse: true,
        },
        returnRequest: {
            requested: { type: Boolean, default: false },
            reason: { type: String },
            approved: { type: Boolean, default: false },
            approvedAt: { type: Date },
            refunded: { type: Boolean, default: false },
            refundedAt: { type: Date },
            refundAmount: { type: Number }, // Added refund amount
            refundReason: { type: String }, // Added refund reason
        },
        fulfillment: {
            courier: { type: String },
            trackingNumber: { type: String },
        },
        notifications: {
            paymentNotified: { type: Boolean, default: false },
            deliveryNotified: { type: Boolean, default: false },
        },
        notes: {
            type: String,
        },
        subscriptionOrder: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);