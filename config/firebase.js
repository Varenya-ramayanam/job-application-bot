const admin = require('firebase-admin');
const path = require('path');

if (!admin.apps.length) {
  const serviceAccount = require(path.join(
    __dirname,
    'serviceAccountKey.json'
  ));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin Initialized');
}

const db = admin.firestore();

module.exports = { admin, db };
