const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const algorithm = 'aes-256-cbc'; //Using AES encryption

export function checkEmptyFilter(elm: any) {
  return elm != null && elm !== false && elm !== '';
}

//Encrypting text
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16); // Initialization vector should be 16 bytes for aes-256-cbc
  const key = process.env.ENCRYPTED_KEY || '';

  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}
// Decrypting text
export function decrypt(encryptedText: string): string {
  const key = process.env.ENCRYPTED_KEY || '';
  if (!encryptedText) {
    throw new Error('Text must be provided');
  }
  const textParts = encryptedText.split(':');

  const iv = Buffer.from(textParts[0], 'hex');
  const encryptedData = Buffer.from(textParts[1], 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

export function convertToMongoDBDate(dateString: string): string {
  const [datePart, timePart] = dateString.split(' ');

  const [month, day, year] = datePart.split('/').map(Number);

  const [hours, minutes] = timePart.split(':').map(Number);

  const date = new Date(year, month - 1, day, hours, minutes);

  let isoString = date.toISOString().split('.')[0];

  // Append the hardcoded milliseconds and offset
  const mongoDBDate = `${isoString}.555+00:00`;

  return mongoDBDate;
}
