const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendOtpEmail = async (toEmail, otp) => {
    await transporter.sendMail({
        from: `"Your App" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Your Password Reset OTP",
        text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
    });
};

module.exports = { sendOtpEmail };

