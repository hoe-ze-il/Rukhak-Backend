import nodemailer from "nodemailer";

const sendEmailWithNodemailer = async (emailData) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      requireTLS: true,
      debug: true,
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const info = await transporter.sendMail(emailData);
    console.log(`Message sent: ${info.response}`);
    return true;
  } catch (err) {
    console.error(`Problem sending email: ${err}`);
    return false;
  }
};

export default sendEmailWithNodemailer;
