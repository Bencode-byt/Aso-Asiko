const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./db");
const mongoSanitize = require("./middlewares/sanitizeInput");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const cors = require("cors"); // Import CORS

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Security HTTP headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 minutes
});
app.use(limiter);

// Enable CORS
app.use(cors());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize); // Applied once

// Data sanitization against XSS
app.use(xss());

// Debug Logging Middleware (Optional - remove for production)
console.log("🔐 Loaded JWT_SECRET:", process.env.JWT_SECRET);
app.use((req, res, next) => {
    console.log(`🧪 Incoming ${req.method} request to ${req.path}`);
    next();
});

// Import Routes
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user"); // Corrected route name
const productRoutes = require("./routes/product"); // Corrected route name
const orderRoutes = require("./routes/order");
const paymentRoutes = require("./routes/payment");

// Route Mounts
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// Error handling middleware
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

// Base Route (Optional)
app.get("/", (req, res) => {
    res.send("✅ Aso Asiko Ecommerce API is Running...");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});