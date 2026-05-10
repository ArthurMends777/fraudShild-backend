import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  rawToken: string
) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  await transporter.sendMail({
    from: `"FraudShield" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Recuperação de senha — FraudShield',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Olá, ${name}!</h2>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>FraudShield</strong>.</p>
        <p>Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            margin: 16px 0;
            padding: 12px 24px;
            background-color: #4f46e5;
            color: white;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
          "
        >
          Redefinir senha
        </a>
        <p style="color: #666; font-size: 13px;">
          Se você não solicitou a redefinição, ignore este e-mail — sua senha não será alterada.
        </p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #aaa; font-size: 11px;">FraudShield — Proteção contra golpes e fake news</p>
      </div>
    `,
  });
};
