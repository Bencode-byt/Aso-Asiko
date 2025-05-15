const Order = require("../model/Order");
const PDFDocument = require("pdfkit");
const User = require("../model/User");
const Product = require("../model/Product"); // Corrected model name

/**
 * Update an order to paid status after successful payment
 * @route   PUT /api/orders/pay
 * @access  Private (user must be authenticated)
 */
exports.updateOrderToPaid = async (req, res) => {
    try {
        const { orderId, paymentMethod, paymentResult } = req.body;

        // Validate required fields
        if (!orderId || !paymentMethod || !paymentResult) {
            return res
                .status(400)
                .json({ message: "All payment details are required." });
        }

        // Find the order by ID
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        // Update payment info
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentMethod = paymentMethod;

        // Save detailed payment result
        order.paymentResult = {
            transactionId: paymentResult.transactionId || "",
            status: paymentResult.status || "success",
            paymentDate: new Date(),
            currency: paymentResult.currency || "NGN",
            exchangeRate: paymentResult.exchangeRate || 1,
        };

        // Set notification flag
        order.notifications.paymentNotified = true;

        // Auto-generate invoiceRef if not set
        if (!order.invoiceRef) {
            order.invoiceRef = `INV-<span class="math-inline">\{Date\.now\(\)\.toString\(\)\.slice\(\-6\)\}\-</span>{Math.floor(
                Math.random() * 10000
            )}`;
        }

        // Add to status history
        order.statusHistory.push({
            status: "paid",
            updatedAt: new Date(),
        });

        const updatedOrder = await order.save();

        res.status(200).json({
            message: "✅ Payment successful! Order updated.",
            order: updatedOrder,
        });
    } catch (error) {
        console.error("Error updating payment status:", error.message);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
};

// ✅ Create a new order (Checkout)
exports.checkout = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            totalPrice,
            notes
        } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: "No order items provided." });
        }

        const invoiceRef = `INV-<span class="math-inline">\{Date\.now\(\)\.toString\(\)\.slice\(\-6\)\}\-</span>{Math.floor(Math.random() * 10000)}`;

        const newOrder = new Order({
            user: req.user.id,
            orderItems,
            shippingAddress,
            paymentMethod,
            totalPrice,
            notes,
            invoiceRef,
            statusHistory: [{ status: "processing" }]
        });

        const savedOrder = await newOrder.save();

        res.status(201).json({
            message: "🧾 Order placed successfully!",
            order: savedOrder
        });
    } catch (error) {
        console.error("Error placing order:", error.message);
        res.status(500).json({ message: "Failed to place order." });
    }
};

// Get User's Orders
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching user orders:", error.message);
        res.status(500).json({ message: "Failed to fetch your orders." });
    }
};

// Get All Orders (Admin & Salesgirl)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'username email');
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching all orders:", error.message);
        res.status(500).json({ message: "Failed to fetch all orders." });
    }
};

// Update Order Status (Admin & Salesgirl)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        order.deliveryStatus = status;
        order.statusHistory.push({ status, updatedAt: new Date() });
        await order.save();

        res.status(200).json({ message: "Order status updated successfully.", order });
    } catch (error) {
        console.error("Error updating order status:", error.message);
        res.status(500).json({ message: "Failed to update order status." });
    }
};

// Process Refund (Admin)
exports.processRefund = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { refundAmount, reason } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        order.returnRequest.refunded = true;
        order.returnRequest.refundedAt = new Date();
        order.returnRequest.refundAmount = refundAmount;
        order.returnRequest.refundReason = reason;
        // Implement actual refund processing logic here (e.g., interacting with payment gateway)

        await order.save();

        res.status(200).json({ message: "Refund processed successfully.", order });
    } catch (error) {
        console.error("Error processing refund:", error.message);
        res.status(500).json({ message: "Failed to process refund." });
    }
};

// Mark order as delivered and update status
exports.updateOrderToDelivered = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        order.isDelivered = true;
        order.deliveredAt = Date.now();
        order.deliveryStatus = "delivered";

        // Push to status history
        order.statusHistory.push({ status: "delivered", updatedAt: new Date() });

        const updatedOrder = await order.save();

        res.json({
            message: "Order marked as delivered",
            order: updatedOrder,
        });
    } catch (error) {
        console.error("Delivery update failed:", error.message);
        res.status(500).json({ message: "Error marking order as delivered" });
    }
};

/**
 * Generate PDF Invoice for a specific order
 * @route   GET /api/orders/:orderId/invoice
 * @access  Private (Authenticated)
 */
exports.generateInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate("user", "username email phoneNumber") // Include phone number
            .populate("orderItems.product", "name price");

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        const doc = new PDFDocument();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=invoice-${orderId}.pdf`
        );

        doc.pipe(res);

        // PDF Header
        doc.fontSize(20).text("Aso Asiko Invoice", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Invoice ID: ${order._id}`);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
        doc.text(`Customer: ${order.user.username}`);
        doc.text(`Email: ${order.user.email}`);
        doc.text(`Phone: ${order.shippingAddress.phone}`);
        doc.text(`Shipping Address: ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.country}`);
        doc.moveDown();

        doc.text("Order Items:", { underline: true });
        order.orderItems.forEach((item, index) => {
            doc.text(
                `${index + 1}. ${item.product.name} (x${item.quantity}, Color: ${item.selectedColor}) - ₦${item.product.price * item.quantity}`
            );
        });

        doc.moveDown();
        doc.text(`Total Price: ₦${order.totalPrice}`, { bold: true });
        doc.text(`Payment Status: ${order.isPaid ? "Paid" : "Unpaid"}`);
        doc.text(`Delivery Status: ${order.deliveryStatus}`);

        doc.end();

    } catch (err) {
        console.error("Error generating invoice:", err.message);
        res.status(500).json({ message: "Failed to generate invoice." });
    }
};

/**
 * @desc    Handle return or refund request
 * @route   PUT /api/orders/:orderId/return
 * @access  Private (Customer can request return; Admin/Salesgirl approves)
 */
exports.handleReturnOrRefund = async (req, res) => {
    const { action, reason } = req.body;
    const { orderId } = req.params;

    if (!action || !["requested", "approved", "rejected"].includes(action)) {
        return res.status(400).json({ message: "Invalid action for return/refund." });
    }

    try {
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        // If customer initiates return
        if (action === "requested") {
            if (order.returnRequest && order.returnRequest.requested) {
                return res.status(400).json({ message: "Return request already submitted." });
            }

            order.returnRequest = {
                requested: true,
                reason: reason || "Not specified",
            };

            await order.save();

            return res.status(200).json({ message: "Return requested.", order });
        }

        // If admin or salesgirl approves/rejects
        const userRole = req.user.role || (req.user.isAdmin ? "admin" : "user");

        if (userRole !== "admin" && userRole !== "salesgirl") {
            return res.status(403).json({ message: "Only admin or salesgirl can approve/reject returns." });
        }

        if (action === "approved") {
            order.returnRequest.approved = true;
            order.returnRequest.approvedAt = new Date();
        } else if (action === "rejected") {
            order.returnRequest.approved = false; // Explicitly set to false
            order.returnRequest.approvedAt = new Date(); // Still log the review time
            order.returnRequest.reason = reason || order.returnRequest.reason || "Return rejected."; // Keep original reason if available
        }

        await order.save();

        return res.status(200).json({ message: `Return ${action}.`, order });
    } catch (err) {
        console.error("Error processing return/refund:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};