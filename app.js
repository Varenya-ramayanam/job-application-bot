const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const router = require('./routes/index');
const cors = require('cors');
const morgan = require('morgan');
 
dotenv.config(); 
   

// 🚀 App Init
const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// 📦 Routes
app.use('/api', router);

// ⚡ DB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// 🚪 Start Server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
