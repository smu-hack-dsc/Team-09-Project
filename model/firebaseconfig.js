const admin = require('firebase-admin');

// Replace the serviceAccountKeyPath with the path to your Firebase Admin SDK service account key
const serviceAccount = require('./meetngo-84f89-firebase-adminsdk-83d9o-be9f1c12a7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://meetngo-84f89.firebaseio.com" // Replace with your Firebase project's database URL
});

const db = admin.firestore();

module.exports = { db };

