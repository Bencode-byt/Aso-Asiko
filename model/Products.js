const mongoose = require("mongoose");
const slugify = require("slugify");

// Review Schema for Product Reviews
const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        username: {
            type: String,
            required: true,
            trim: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
        },
        brand: { // Added brand field
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Price cannot be negative"],
        },
        description: {
            type: String,
            required: [true, "Product description is required"],
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Product category is required"],
            trim: true,
        },
        imageUrl: {
            type: String,
            required: [true, "Image URL is required"],
        },
        images: {
            type: [String],
            default: [],
        },
        variants: {
            type: [String],
            default: [],
        },
        countInStock: {
            type: Number,
            required: [true, "Stock count is required"],
            min: [0, "Stock cannot be negative"],
            default: 0,
        },
        lowStockAlert: {
            type: Number,
            default: 5,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        seo: {
            metaTitle: { type: String },
            metaDescription: { type: String },
        },
        reviews: [reviewSchema],
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        numReviews: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Generate SEO slug before saving
productSchema.pre("save", function (next) {
    if (!this.slug && this.name) {
        this.slug = slugify(this.name, { lower: true });
    }
    next();
});

module.exports = mongoose.model("Product", productSchema);