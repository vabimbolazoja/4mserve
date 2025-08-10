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
    from: "4marketDays",
    to,
    subject,
    html,
  });
};

export default sendEmail;
