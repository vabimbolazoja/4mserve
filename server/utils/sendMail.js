import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: "elitetrustsinvestment@gmail.com",
        pass: "qnkbqegdrpznroqh",
    },
  });

  await transporter.sendMail({
    from: `"YourApp" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;
