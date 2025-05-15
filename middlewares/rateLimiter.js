const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: {
        message: "Too many login attempts. Please try again after 10 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = loginLimiter;