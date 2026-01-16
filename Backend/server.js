require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const prayerRoutes = require('./routes/prayers');
const adminAuthRoutes = require('./routes/adminAuth');

const bookRoutes = require('./routes/books');
const categoryRoutes = require('./routes/categories');
const teachingRoutes = require('./routes/teachings');
const teachingCategoryRoutes = require("./routes/teachingCategories");


app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000'],
  credentials: true
}));

// Session (required by passport for some setups). We set a short secret.
app.use(session({
  secret: process.env.SESSION_SECRET || 'sesssecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// init passport
app.use(passport.initialize());
app.use(passport.session());

// minimal passport serialize/deserialize (not used for JWT flow but required)
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const User = require('./models/user');
    const user = await User.findById(id);
    done(null, user);
  } catch (err) { done(err) }
});

app.use('/books', bookRoutes);
app.use('/categories', categoryRoutes);
app.use('/admin', adminAuthRoutes);
app.use('/auth', authRoutes);
app.use('/prayers', prayerRoutes);
app.use('/teachings', teachingRoutes);
app.use("/teaching-categories", teachingCategoryRoutes);



// Serve uploaded PDFs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// serve frontend static if you host from same server
app.use(express.static(path.join(__dirname, '../Frontend')));

app.use(
  "/assets",
  express.static(path.join(__dirname, "../Frontend/assets"))
);

const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> {
    console.log('DB connected');
    app.listen(PORT, ()=> console.log('Server running on', PORT));
  }).catch(err => {
    console.error('DB connection error', err);
  });

  app.get("/prayer/:id", async (req, res) => {
  const Prayer = require("./models/Prayer");
  const prayer = await Prayer.findById(req.params.id);

  if (!prayer) return res.status(404).send("Not found");

  const siteUrl = `${req.protocol}://${req.get("host")}`;
  const imageUrl = `${siteUrl}/assets/images/prayer-share.png`;

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />

  <!-- Open Graph -->
  <meta property="og:title" content="🙏 Prayer Request" />
  <meta property="og:description" content="${prayer.request}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${siteUrl}/prayer/${prayer._id}" />
  <meta property="og:type" content="website" />

  <!-- WhatsApp -->
  <meta name="twitter:card" content="summary_large_image" />

</head>
<body>
  <script>
    window.location.href = "/";
  </script>
</body>
</html>
`);
});
