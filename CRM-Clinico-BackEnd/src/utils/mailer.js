const nodemailer = require('nodemailer');

let transporter;

const getFrontendUrl = () => {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    throw new Error('Configuración SMTP incompleta');
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: {
      user,
      pass
    }
  });

  return transporter;
};

const enviarCorreoRecuperacionPassword = async ({ email, nombre, otp }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Tu código de recuperación de contraseña',
    text: `Hola ${nombre || 'usuario'},\n\nRecibimos una solicitud para restablecer tu contraseña. Tu código OTP es: ${otp}\n\nIngresa este código en la pantalla de recuperación para continuar. Este código expirará en 10 minutos. Si no solicitaste este cambio, puedes ignorar este mensaje.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <h2 style="margin-bottom: 16px;">Recuperación de contraseña</h2>
        <p>Hola ${nombre || 'usuario'},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Usa este código OTP para continuar:</p>
        <div style="margin: 24px 0; padding: 18px 24px; display: inline-block; background: #0f172a; color: #ffffff; border-radius: 12px; font-size: 28px; letter-spacing: 8px; font-weight: 700;">
          ${otp}
        </div>
        <p>Ingresa este código en la pantalla de recuperación para validar tu identidad y luego podrás definir una nueva contraseña.</p>
        <p>Este código expirará en 10 minutos. Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
      </div>
    `
  };

  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    return {
      simulated: true,
      sent: false
    };
  }

  await mailTransporter.sendMail(mailOptions);

  return {
    simulated: false,
    sent: true
  };
};

module.exports = {
  enviarCorreoRecuperacionPassword,
  getFrontendUrl
};