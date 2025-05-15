const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendSMS = require("../utils/sendSMS");
const sendEmail = require("../utils/sendEmail"); // Added for potential email verification
const crypto = require("crypto");
require("dotenv").config();

// Register Admin (Manual Only)
exports.registerAdmin = async (req, res) => {
    const { username, email, password, phoneNumber } = req.body; // Using consistent phoneNumber

    if (!username || !email || !password || !phoneNumber) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            email,
            phoneNumber,
            password: hashedPassword,
            isAdmin: true,
            role: "admin",
        });

        await user.save();
        res.status(201).json({ message: "Admin registered successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Register Customer
exports.registerCustomer = async (req, res) => {
    const { username, email, password, phoneNumber } = req.body; // Using consistent phoneNumber

    if (!username || !email || !password || !phoneNumber) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            email,
            phoneNumber,
            password: hashedPassword,
            role: "customer",
        });

        await user.save();
        res.status(201).json({ message: "Customer registered successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Login (Send 2FA OTP)
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

        user.twoFACode = otp; // Using consistent twoFACode
        user.twoFACodeExpiry = otpExpiry; // Using consistent twoFACodeExpiry
        await user.save();

        // Send OTP via SMS
        await sendSMS(user.phoneNumber, `Your Aso Asiko login OTP is: ${otp}`);

        res.status(200).json({
            message: "OTP sent to your phone for verification.",
            userId: user._id,
        });
    } catch (err) {
        res.status(500).json({ message: "Login failed", error: err.message });
    }
};

// Verify OTP and Issue Token
exports.verifyCode = async (req, res) => {
    const { userId, twoFACode } = req.body; // Using consistent twoFACode

    try {
        const user = await User.findById(userId);
        if (!user || !user.twoFACode || user.twoFACode !== twoFACode) {
            return res.status(401).json({ message: "Invalid or expired OTP." });
        }

        if (user.twoFACodeExpiry < Date.now()) {
            return res.status(410).json({ message: "OTP expired. Please login again." });
        }

        // Clear OTP
        user.twoFACode = undefined;
        user.twoFACodeExpiry = undefined;
        await user.save();

        // Issue token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "2d" }
        );

        res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isAdmin: user.isAdmin,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "OTP verification failed", error: err.message });
    }
};

// Request Password Reset via Phone
exports.forgotPassword = async (req, res) => {
    const { phoneNumber } = req.body; // Using consistent phoneNumber

    try {
        const user = await User.findOne({ phoneNumber });
        if (!user) return res.status(404).json({ message: "Phone number not found." });

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + parseInt(process.env.RESET_TOKEN_EXPIRY); // Use env variable
        await user.save();

        const resetLink = `${req.headers.origin}/reset-password/${resetToken}`; // Adjust link as needed
        await sendSMS(phoneNumber, `Your Aso Asiko password reset link: ${resetLink}`);

        res.status(200).json({ message: "Password reset link sent to your phone.", userId: user._id });
    } catch (err) {
        res.status(500).json({ message: "Failed to request password reset", error: err.message });
    }
};

// Reset Password with Token
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successful. Please login." });
    } catch (err) {
        res.status(500).json({ message: "Password reset failed", error: err.message });
    }
};

// Get Current User Info (Protected Route)
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch user info.", error: err.message });
    }
};