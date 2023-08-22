// const jwtSecretKey = 'heapie'
const crypto = require('crypto');

// Replace this with a strong and secure encryption key
const encryptionKey = crypto.randomBytes(32); // Generating a secure key
const iv = crypto.randomBytes(16); // Initialization Vector


module.exports = {encryptionKey,iv}