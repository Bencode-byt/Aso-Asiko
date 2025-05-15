const axios = require("axios");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../model/Order");
const sendEmail = require("../utils/sendEmail");

// Initialize Paystack Payment (NGN)
exports.initializePaystackPayment = async (req, res) => {
    const { email, amount, orderId } = req.body; // Include orderId

    if (!email || !amount || !orderId) {
        return res.status(400).json({ message: "Email, amount, and orderId are required!" });
    }

    try {
        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email,
                amount: amount * 100, // Paystack uses kobo
                metadata: { orderId }, // Attach orderId for verification
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        res.json({
            authorization_url: response.data.data.authorization_url,
            reference: response.data.data.reference,
        });
    } catch (err) {
        console.error(" Paystack Init Error:", err.message);

        await sendEmail(
            email,
            " Payment Initialization Failed - Aso Asiko",
            `Hello,\n\nUnfortunately, we could not initialize your payment.\n\nPlease try again.\n\nRegards,\nAso Asiko Team`
        );

        res.status(500).json({ message: "Paystack initialization failed" });
    }
};

// Create Stripe Payment Intent (USD, GBP, EUR, etc.)
exports.createStripePaymentIntent = async (req, res) => {
    const { amount, currency, email, orderId } = req.body; // Include orderId

    if (!amount || !currency || !email || !orderId) {
        return res.status(400).json({ message: "Amount, currency, email, and orderId are required!" });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.floor(amount * 100), // Stripe expects smallest currency unit
            currency,
            metadata: { email, orderId }, // track user and order for reconciliation
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error(" Stripe Payment Error:", err.message);

        await sendEmail(
            email,
            " Payment Failed - Aso Asiko",
            `Hello,\n\nYour payment attempt failed. Please try again or contact support.\n\nRegards,\nAso Asiko Team`
        );

        res.status(500).json({ message: "Stripe payment failed!" });
    }
};

// Record Crypto Payment (Assumed Valid - NEEDS BLOCKCHAIN VERIFICATION)
exports.cryptoPayment = async (req, res) => {
    const { txHash, email, amount, currency, orderId } = req.body; // Include orderId

    if (!txHash || !email || !amount || !currency || !orderId) {
        return res.status(400).json({ message: "All fields are required (txHash, email, amount, currency, orderId)." });
    }

    try {
        // **CRITICAL SECURITY WARNING:**
        // In this application, you MUST verify the txHash with the blockchain explorer API
        // (e.g., Etherscan, Blockcypher) to ensure the transaction is valid and confirmed.
        
        // Optionally: Record order or transaction details in the database
        const order = await Order.findById(orderId);
        if (order) {
            order.isPaid = true;
            order.paidAt = new Date();
            order.paymentMethod = "crypto";
            order.paymentResult = {
                transactionId: txHash,
                status: "success", // REPLACE WITH ACTUAL VERIFICATION
                currency,
                amount,
            };
            await order.save();
        }

        await sendEmail(
            email,
            " Crypto Payment Received - Aso Asiko",
            `Hello,\n\nWe received your crypto payment (TX: ${txHash}) for ${amount} ${currency}.\nYour order ID is: ${orderId}.\n\nThank you for shopping with Aso Asiko!\n\nRegards,\nAso Asiko Team`
        );

        res.json({ message: "Crypto payment recorded successfully!", txHash, orderId });
    } catch (err) {
        console.error(" Crypto Payment Error:", err.message);

        await sendEmail(
            email,
            " Crypto Payment Failed - Aso Asiko",
            `Hello,\n\nUnfortunately, your crypto payment attempt failed.\n\nPlease try again.\n\nRegards,\nAso Asiko Team`
        );

        res.status(500).json({ message: "Crypto payment failed!" });
    }
};

// Handle Payment Webhook (Example for Paystack - Adapt for others)
exports.handlePaymentWebhook = async (req, res) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // Verify event using Paystack signature
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    if (hash === req.headers['x-paystack-signature']) {
        const event = req.body.data;
        try {
            if (event.event === 'charge.success') {
                const orderId = event.metadata.orderId;
                const paymentReference = event.reference;
                // Update order status in your database based on paymentReference and orderId
                const order = await Order.findById(orderId);
                if (order && !order.isPaid) {
                    order.isPaid = true;
                    order.paidAt = new Date();
                    order.paymentMethod = "paystack";
                    order.paymentResult = {
                        transactionId: paymentReference,
                        status: "success",
                        paymentDate: new Date(),
                        currency: event.currency,
                        amount: event.amount / 100,
                    };
                    order.notifications.paymentNotified = true;
                    await order.save();
                    console.log(`✅ Order ${orderId} paid successfully via Paystack.`);
                }
            }
            return res.sendStatus(200);
        } catch (error) {
            console.error('Webhook error:', error);
            return res.sendStatus(500);
        }
    } else {
        return res.sendStatus(401);
    }
};

// Initiate Payment (Generic - Could be used for redirecting to payment gateway)
exports.initiatePayment = async (req, res) => {
    // This function might be redundant depending on how your frontend handles initiation
    // For direct gateway integrations, the initializePaystackPayment or createStripePaymentIntent are more specific
    res.status(501).json({ message: "Not implemented. Use specific payment gateway initiation." });
};