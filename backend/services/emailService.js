const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    try {
      const env = require('../config/environment');

      if (env.node_env === 'production' && env.smtp.user && env.smtp.pass) {
        // En producción usamos las credenciales SMTP reales del .env
        this.transporter = nodemailer.createTransport({
          host: env.smtp.host,
          port: env.smtp.port,
          secure: env.smtp.port == 465, // true para 465, false para 587 o 25
          auth: {
            user: env.smtp.user,
            pass: env.smtp.pass,
          },
        });
        logger.info('Servicio de correos inicializado con credenciales SMTP reales (Producción).');
      } else {
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
        logger.info('Servicio de correos (Ethereal) inicializado con éxito para pruebas.');
      }
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
      const fromEmail = this.transporter.options.auth?.user || 'no-reply@sicag.com';
      const info = await this.transporter.sendMail({
        from: `"SICAG Soporte" <${fromEmail}>`,
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
    } catch (error) {
      logger.error('Error enviando correo de verificación:', error);
      throw new Error('No se pudo enviar el correo.');
    }
  }

  async sendContactEmail(toEmails, contactData) {
    if (!this.transporter) {
      logger.warn('Transporter no disponible, simulando envío en consola.');
      logger.info(`[SIMULACIÓN CONTACTO] Para: ${toEmails} | De: ${contactData.nombre}`);
      return;
    }

    try {
      const fromEmail = this.transporter.options.auth?.user || 'no-reply@sicag.com';
      const info = await this.transporter.sendMail({
        from: `"SICAG Portal Público" <${fromEmail}>`,
        to: toEmails.join(', '),
        subject: `Nuevo Mensaje de Contacto - ${contactData.consejoComunal || 'SICAG'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2E7D32; border-bottom: 2px solid #2E7D32; padding-bottom: 10px;">Nuevo Mensaje Recibido</h2>
            <p><strong>Nombre:</strong> ${contactData.nombre}</p>
            <p><strong>Correo:</strong> ${contactData.correo || 'No proporcionado'}</p>
            <p><strong>Consejo Comunal:</strong> ${contactData.consejoComunal || 'No seleccionado'}</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #4CAF50;">
              <p style="margin: 0; white-space: pre-wrap;">${contactData.mensaje}</p>
            </div>
            <p style="font-size: 12px; color: #777; margin-top: 30px;">
              Este mensaje fue enviado desde el formulario de contacto del portal público SICAG.
            </p>
          </div>
        `,
      });

      logger.info(`Correo de contacto enviado. ID: ${info.messageId}`);
    } catch (error) {
      logger.error('Error enviando correo de contacto:', error);
      throw new Error('No se pudo enviar el correo de contacto.');
    }
  }
}

module.exports = new EmailService();
