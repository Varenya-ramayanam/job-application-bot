const express = require('express');
const { applyJobs } = require('../controllers/applyController'); // adjust path if needed

const router = express.Router();

router.post('/apply', applyJobs);

module.exports = router;
