// controllers/contactController.js
import nodemailer from "nodemailer";

export const contactUs = async (req, res) => {
  const { fullName, email, subject, message } = req.body;

  try {
    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // configure transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // you can use any SMTP (e.g. Outlook, SendGrid, custom domain)
      auth: {
        user: "elitetrustsinvestment@gmail.com",
        pass: "qnkbqegdrpznroqh",
      },
    });

    // email options
    const mailOptions = {
      from: `"${fullName}" <${email}>`,
      to:"marketdays462@gmail.com", // destination email (e.g. support@yourdomain.com)
      subject: subject,
      text: `
        You have a new contact form submission:

        Full Name: ${fullName}
        Email: ${email}
        Subject: ${subject}
        Message: ${message}
      `,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Full Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    // send mail
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Message sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
