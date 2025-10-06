const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('verifyToken - Headers:', req.headers);
  console.log('verifyToken - Token:', token);
  if (!token) {
    console.log('verifyToken - No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('verifyToken - Decoded:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('verifyToken - Token verification error:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { verifyToken };
