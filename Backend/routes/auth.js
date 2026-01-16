// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendMail'); // YOUR sendMail.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXP = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REMEMBER_EXP = process.env.JWT_REMEMBER_EXPIRES_IN || '30d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';

// Passport Google Strategy (stateless: we will create token and redirect with it)
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] && profile.emails[0].value;
    const name = profile.displayName || (profile.name && `${profile.name.givenName} ${profile.name.familyName}`) || 'Google User';

    if (!email) return done(new Error('No email from Google'));

    let user = await User.findOne({ email });

    if (!user) {
      // create user with a random password (they will use Google)
      user = await User.create({ name, email, password: crypto.randomBytes(16).toString('hex') });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// --- signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name||!email||!password) return res.status(400).json({ message:'Missing fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message:'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hash });
    return res.status(201).json({ message: 'User created' });
  } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }) }
});

// --- signin
router.post('/signin', async (req, res) => {
  try {
    const { email, password, keep } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const expiresIn = keep ? JWT_REMEMBER_EXP : JWT_EXP;
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: keep ? 30*24*3600*1000 : 3600*1000
    });

    return res.json({ message: 'Signed in', token, user: { name: user.name, email: user.email } });
  } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }) }
});

// --- forgot password (send 6-digit code via email)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message:'Provide email' });
    const user = await User.findOne({ email });
    if (!user) return res.json({ message:'If your email exists, you will receive reset instructions' }); // avoid leaking

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetExpires = Date.now() + 3600*1000; // 1h
    await user.save();

    // Send email with the code (HTML)
    const html = `
      <p>We received a request to reset your password.</p>
      <p>Your 6-digit reset code: <strong>${code}</strong></p>
      <p>This code will expire in 1 hour. If you did not request this, ignore this email.</p>
    `;
    try {
      await sendEmail(email, 'Your password reset code', html);
    } catch (errEmail) {
      console.error('Sending email failed', errEmail);
      // still return success message to avoid leaking
    }

    return res.json({ message: 'If your email exists, a reset code has been sent' });
  } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }) }
});

// --- verify code & reset password
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ message:'Missing fields' });

    const user = await User.findOne({
      email,
      resetCode: code,
      resetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message:'Invalid or expired code' });

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetCode = undefined;
    user.resetExpires = undefined;
    await user.save();

    return res.json({ message: 'Password reset' });
  } catch(err){ console.error(err); res.status(500).json({ message:'Server error' }) }
});

// --- Google OAuth (start)
router.get('/google', passport.authenticate('google', { scope: ['profile','email'] }));

// --- Google OAuth callback
router.get('/google/callback', passport.authenticate('google', { failureRedirect: FRONTEND_URL + '/?auth=failed', session: false }), (req, res) => {
  // user is available at req.user
  const user = req.user;
  const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXP });

  // Redirect to frontend with token (frontend should read token from query)
  const redirectTo = `${FRONTEND_URL}/?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`;
  res.redirect(redirectTo);
});

/* GET /me — verify token */
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message:'Unauthorized' });
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.userId).select('-password');
    if (!user) return res.status(401).json({ message:'Unauthorized' });
    res.json(user);
  } catch(err){ console.error(err); res.status(401).json({ message: 'Unauthorized' }) }
});

module.exports = router;
