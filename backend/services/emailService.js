const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const env = require('../config/environment');

class EmailService {
  constructor() {
    this.transporter = null;
    this.useHttpApi = false;
    this.apiKey = env.smtp?.pass || process.env.EMAIL_API_KEY;
    this.apiProvider = null;
    this.initTransporter();
  }

  async initTransporter() {
    try {
      if (env.node_env === 'production') {
        // Detectar si la "contraseña" es una API Key de Resend (empieza con re_) o SendGrid (empieza con SG.)
        if (this.apiKey && this.apiKey.startsWith('re_')) {
          this.useHttpApi = true;
          this.apiProvider = 'resend';
          logger.info('Servicio de correos inicializado usando API HTTP (Resend). Evitando bloqueo SMTP de Render.');
          return;
        } else if (this.apiKey && this.apiKey.startsWith('SG.')) {
          this.useHttpApi = true;
          this.apiProvider = 'sendgrid';
          logger.info('Servicio de correos inicializado usando API HTTP (SendGrid). Evitando bloqueo SMTP de Render.');
          return;
        } else if (this.apiKey && this.apiKey.startsWith('xkeysib-')) {
          this.useHttpApi = true;
          this.apiProvider = 'brevo';
          logger.info('Servicio de correos inicializado usando API HTTP (Brevo/Sendinblue). Evitando bloqueo SMTP de Render.');
          return;
        }

        // Fallback a SMTP normal (que fallará en Render Free, pero funciona local o en planes pagos)
        if (env.smtp && env.smtp.user && env.smtp.pass) {
          this.transporter = nodemailer.createTransport({
            host: env.smtp.host,
            port: env.smtp.port,
            secure: env.smtp.port == 465,
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 8000,
            auth: { user: env.smtp.user, pass: env.smtp.pass }
          });
          logger.info('Servicio de correos inicializado con credenciales SMTP tradicionales.');
        }
      } else {
        // Desarrollo local: Ethereal
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass }
        });
        logger.info('Servicio de correos (Ethereal) inicializado con éxito para pruebas.');
      }
    } catch (error) {
      logger.error('Error inicializando el servicio de correos:', error);
    }
  }

  async _sendViaHttpApi(toEmail, subject, htmlContent) {
    let url, method = 'POST', headers = {}, body = {};
    const fromEmail = env.smtp?.user || 'no-reply@sicag.com';
    const fromName = "SICAG Portal";

    if (this.apiProvider === 'resend') {
      url = 'https://api.resend.com/emails';
      headers = { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' };
      body = { from: `${fromName} <onboarding@resend.dev>`, to: [toEmail], subject, html: htmlContent };
    } 
    else if (this.apiProvider === 'sendgrid') {
      url = 'https://api.sendgrid.com/v3/mail/send';
      headers = { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' };
      body = {
        personalizations: [{ to: [{ email: toEmail }] }],
        from: { email: fromEmail, name: fromName },
        subject: subject,
        content: [{ type: 'text/html', value: htmlContent }]
      };
    }
    else if (this.apiProvider === 'brevo') {
      url = 'https://api.brevo.com/v3/smtp/email';
      headers = { 'api-key': this.apiKey, 'Content-Type': 'application/json' };
      body = {
        sender: { name: fromName, email: fromEmail },
        to: [{ email: toEmail }],
        subject: subject,
        htmlContent: htmlContent
      };
    }

    const response = await fetch(url, { method, headers, body: JSON.stringify(body) });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error API ${this.apiProvider}: ${response.status} - ${errText}`);
    }
    return response;
  }

  async sendVerificationCode(toEmail, code) {
    const subject = "Código de Verificación - SICAG";
    const htmlContent = `
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
        <p style="font-size: 12px; color: #777; margin-top: 40px; text-align: center;">Si no solicitaste este código, ignora este correo.</p>
      </div>`;

    if (this.useHttpApi) {
      try {
        await this._sendViaHttpApi(toEmail, subject, htmlContent);
        logger.info(`Correo de verificación enviado a ${toEmail} vía API HTTP (${this.apiProvider})`);
        return;
      } catch (error) {
        logger.error('Error enviando código vía HTTP API:', error);
        throw new Error('No se pudo enviar el correo.');
      }
    }

    if (!this.transporter) {
      logger.warn('Transporter no disponible, simulando envío.');
      return;
    }

    try {
      const fromEmail = this.transporter.options.auth?.user || 'no-reply@sicag.com';
      await this.transporter.sendMail({ from: `"SICAG Soporte" <${fromEmail}>`, to: toEmail, subject, html: htmlContent });
      logger.info(`Correo enviado a ${toEmail} vía SMTP`);
    } catch (error) {
      logger.error('Error enviando correo de verificación SMTP:', error);
      throw new Error('No se pudo enviar el correo.');
    }
  }

  async sendContactEmail(toEmails, contactData) {
    const subject = `Nuevo Mensaje de Contacto - ${contactData.consejoComunal || 'SICAG'}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2E7D32; border-bottom: 2px solid #2E7D32; padding-bottom: 10px;">Nuevo Mensaje Recibido</h2>
        <p><strong>Nombre:</strong> ${contactData.nombre}</p>
        <p><strong>Correo:</strong> ${contactData.correo || 'No proporcionado'}</p>
        <p><strong>Consejo Comunal:</strong> ${contactData.consejoComunal || 'No seleccionado'}</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #4CAF50;">
          <p style="margin: 0; white-space: pre-wrap;">${contactData.mensaje}</p>
        </div>
        <p style="font-size: 12px; color: #777; margin-top: 30px;">Mensaje enviado desde el formulario público SICAG.</p>
      </div>`;

    if (this.useHttpApi) {
      try {
        await Promise.all(toEmails.map(email => this._sendViaHttpApi(email, subject, htmlContent)));
        logger.info(`Correo de contacto enviado a admins vía API HTTP (${this.apiProvider})`);
        return;
      } catch (error) {
        logger.error('Error enviando contacto vía HTTP API:', error);
        throw new Error('No se pudo enviar el correo de contacto.');
      }
    }

    if (!this.transporter) return;

    try {
      const fromEmail = this.transporter.options.auth?.user || 'no-reply@sicag.com';
      await this.transporter.sendMail({ from: `"SICAG Portal Público" <${fromEmail}>`, to: toEmails.join(', '), subject, html: htmlContent });
      logger.info(`Correo de contacto enviado a admins vía SMTP`);
    } catch (error) {
      logger.error('Error enviando correo de contacto SMTP:', error);
      throw new Error('No se pudo enviar el correo de contacto.');
    }
  }
}

module.exports = new EmailService();
