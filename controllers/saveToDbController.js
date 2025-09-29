const Application = require('../models/Application');

// Save successfully applied job
const saveToDb = async (job) => {
  try {
    const application = new Application({
      jobTitle: job.jobTitle?.toString() || "Unknown",
      company: job.company?.toString() || "Unknown",
      jobLink: job.jobLink?.toString() || "",
      portal: job.portal?.toString() || "Unknown",
      status: 'applied'
    });

    await application.save();
    console.log(`✅ Saved to DB: ${application.jobTitle} at ${application.company}`);
  } catch (err) {
    console.error('❌ Error saving application to DB:', err.message);
  }
};

module.exports = { saveToDb };

