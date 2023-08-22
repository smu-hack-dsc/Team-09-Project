const crypto = require('crypto');
const config = require('./config');

function encrypt_cookie (data) {
    const cipher = crypto.createCipheriv('aes-256-cbc', config.encryptionKey, config.iv);
    let encryptedData = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encryptedData += cipher.final('hex');

    const encryptedCookie = config.iv.toString('hex') + encryptedData;

    return encryptedCookie;
}

function decrypt_user_data(encryptedCookie,type) {
    try {
      const iv = Buffer.from(encryptedCookie.slice(0, 32), 'hex');
      const encryptedData = encryptedCookie.slice(32);
    
      const decipher = crypto.createDecipheriv('aes-256-cbc', config.encryptionKey, iv);
      let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
      decryptedData += decipher.final('utf8');
    
      const userData = JSON.parse(decryptedData);
    
      if (type === 'access') {
        return userData.accessToken;
      } else if (type === 'email') {
        return userData.profile.email;
      } else {
        return 'Invalid type.';
      }
    } catch (error) {
      console.error('Decryption error:', error);
    }  
  }

module.exports = {decrypt_user_data,encrypt_cookie}