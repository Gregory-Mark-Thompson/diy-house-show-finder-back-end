const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.get('/sign-token', (req, res) => {
  const user = {
    _id: 'test-user-id',
    username: 'test',
  };
  const token = jwt.sign(user, process.env.JWT_SECRET);
  res.json({ token });
});

router.post('/verify-token', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('verify-token - Token:', token); // Debug
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('verify-token - Decoded:', decoded); // Debug
    res.json({ decoded });
  } catch (err) {
    console.error('verify-token - Error:', err.message);
    res.status(401).json({ err: 'Invalid token.' });
  }
});

module.exports = router;
