const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    try {
      // Como estamos en entorno de desarrollo/prueba sin SMTP oficial todavía,
      // creamos una cuenta temporal de Ethereal para simular envíos de correo.
      const testAccount = await nodemailer.createTestAccount();

      this.transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      logger.info('Servicio de correos (Ethereal) inicializado con éxito.');
    } catch (error) {
      logger.error('Error inicializando el servicio de correos:', error);
    }
  }

  async sendVerificationCode(toEmail, code) {
    if (!this.transporter) {
      logger.warn('Transporter no disponible, simulando envío en consola.');
      logger.info(`[SIMULACIÓN CORREO] Para: ${toEmail} | Código: ${code}`);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: '"SICAG Soporte" <no-reply@sicag.com>',
        to: toEmail,
        subject: "Código de Verificación - SICAG",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2E7D32; text-align: center;">SICAG</h2>
            <p>Hola,</p>
            <p>Se ha solicitado un código de verificación para recuperar o cambiar tu contraseña.</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; background-color: #F5F5F5; border-radius: 5px; letter-spacing: 5px; color: #333;">
                ${code}
              </span>
            </div>
            <p>Este código expira en 15 minutos.</p>
            <p style="font-size: 12px; color: #777; margin-top: 40px; text-align: center;">
              Si no solicitaste este código, ignora este correo.
            </p>
          </div>
        `,
      });

      logger.info(`Correo enviado a ${toEmail}. ID: ${info.messageId}`);
      logger.info(`URL de prueba del correo: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      logger.error('Error enviando correo de verificación:', error);
      throw new Error('No se pudo enviar el correo.');
    }
  }
}

module.exports = new EmailService();
