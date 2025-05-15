const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/.+@.+\..+/, "Please enter a valid email address"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
        },
        phoneNumber: { // Consistent naming
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            enum: ["admin", "salesgirl", "customer"],
            default: "customer",
        },
        twoFACode: {
            type: String,
            default: null,
        },
        twoFACodeExpiry: {
            type: Date,
            default: null,
        },
        resetToken: {
            type: String,
            default: null,
        },
        resetTokenExpiry: {
            type: Date,
            default: null,
        },
        isSubscribed: {
            type: Boolean,
            default: true,
        },
        notificationPreferences: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            inApp: { type: Boolean, default: true },
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);