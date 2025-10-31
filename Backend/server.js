require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const prayerRoutes = require('./routes/prayers');


const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000'],
  credentials: true
}));

app.use('/auth', authRoutes);
app.use('/prayers', prayerRoutes);


// serve frontend static if you host from same server
// app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> {
    console.log('DB connected');
    app.listen(PORT, ()=> console.log('Server running on', PORT));
  }).catch(err => {
    console.error('DB connection error', err);
  });
