// utils/sendEmail.js
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Ensure you have SENDGRID_API_KEY in your .env

const sendEmail = async (to, subject, text, html) => {
    try {
        const msg = {
            to: to,
            from: process.env.EMAIL_FROM, // Your verified SendGrid sender email
            subject: subject,
            text: text, // Plain text body
            html: html, // HTML body (optional, but good practice)
        };

        await sgMail.send(msg);
        console.log('📧 Email sent successfully via SendGrid!');
    } catch (error) {
        console.error(' Error sending email via SendGrid:', error);
        if (error.response) {
            console.error(error.response.body);
        }
    }
};

module.exports = sendEmail;