const twilio = require("twilio");

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const senderPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const sendSMS = async (to, message) => {
    try {
        await client.messages.create({
            body: message,
            from: senderPhone,
            to,
        });
        console.log('SMS sent successfully');
    } catch (error) {
        console.error("Error sending SMS:", error.message);
        throw new Error("Failed to send SMS");
    }
};

module.exports = sendSMS;