const nodemailer = require('nodemailer');
import config from '../config';

export const nodeMailerTransport = nodemailer.createTransport({
  host: 'outlook.office365.com',
  port: 587, // Use port 587
  secureConnection: true,
  logger: true,
  debug: true,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
});
