const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobTitle: String,
  company: String,
  jobLink: String,
  portal: String,
  status: String,
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Application', applicationSchema);
