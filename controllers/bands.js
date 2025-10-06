const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verify-token');
const Band = require('../models/band');
const User = require('../models/user');

console.log('verifyToken in bands.js:', typeof verifyToken, verifyToken); // Debug

router.post('/', verifyToken, async (req, res) => {
  try {
    console.log('POST /bands - Request body:', JSON.stringify(req.body, null, 2));
    console.log('POST /bands - User from token:', req.user);
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new Error('User not found for ID: ' + req.user._id);
    }
    req.body.author = req.user._id;
    const band = await Band.create(req.body);
    band._doc.author = req.user;
    res.status(201).json(band);
  } catch (error) {
    console.error('POST /bands - Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const bands = await Band.find({})
      .populate('author')
      .sort({ createdAt: 'desc' });
    res.status(200).json(bands);
  } catch (error) {
    console.error('GET /bands - Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:bandId', async (req, res) => {
  try {
    const band = await Band.findById(req.params.bandId).populate('author');
    if (!band) {
      return res.status(404).json({ error: 'Band not found' });
    }
    res.status(200).json(band);
  } catch (error) {
    console.error('GET /bands/:bandId - Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:bandId', verifyToken, async (req, res) => {
  try {
    const band = await Band.findById(req.params.bandId);
    if (!band.author.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }
    const updatedBand = await Band.findByIdAndUpdate(
      req.params.bandId,
      req.body,
      { new: true }
    );
    updatedBand._doc.author = req.user;
    res.status(200).json(updatedBand);
  } catch (error) {
    console.error('PUT /bands/:bandId - Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:bandId', verifyToken, async (req, res) => {
  try {
    const band = await Band.findById(req.params.bandId);
    if (!band.author.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }
    const deletedBand = await Band.findByIdAndDelete(req.params.bandId);
    res.status(200).json(deletedBand);
  } catch (error) {
    console.error('DELETE /bands/:bandId - Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;