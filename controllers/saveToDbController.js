const { db, admin } = require('../config/firebase');

const saveToDb = async (job) => {
  try {
    const application = {
      jobTitle: job.jobTitle?.toString() || "Unknown",
      company: job.company?.toString() || "Unknown",
      jobLink: job.jobLink?.toString() || "",
      portal: job.portal?.toString() || "Unknown",
      status: 'applied',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('applications').add(application);

    console.log(`✅ Saved to Firestore: ${application.jobTitle}`);
  } catch (err) {
    console.error('❌ Firestore save error:', err.message);
  }
};

module.exports = { saveToDb };
