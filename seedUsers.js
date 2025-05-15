const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./model/User");
const bcrypt = require("bcryptjs");

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { // Use MONGO_URI consistently
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
    seedUsers();
}).catch(err => {
    console.error("Connection error: ", err);
});

async function seedUsers() {
    try {
        const adminExists = await User.findOne({ email: "admin@shop.com" });
        if (adminExists) {
            console.log("Admin already exists");
            return process.exit();
        }

        const hashedPasswordAdmin = await bcrypt.hash("admin123", 10);
        const admin = new User({
            username: "AdminUser",
            email: "admin@shop.com",
            password: hashedPasswordAdmin,
            role: "admin"
        });

        const salesgirlExists = await User.findOne({ email: "salesgirl@shop.com" });
        if (salesgirlExists) {
            console.log("Salesgirl already exists");
            return process.exit();
        }

        const hashedPasswordSalesgirl = await bcrypt.hash("sales123", 10);
        const salesgirl = new User({
            username: "SalesgirlOne",
            email: "salesgirl@shop.com",
            password: hashedPasswordSalesgirl,
            role: "salesgirl"
        });

        await admin.save();
        await salesgirl.save();

        console.log("Admin and salesgirl created successfully!");
        process.exit();
    } catch (err) {
        console.error("Seeding error: ", err.message);
        process.exit(1);
    }
}