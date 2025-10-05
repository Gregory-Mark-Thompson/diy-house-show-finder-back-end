const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Band = require('../models/band.js');
const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
  try {
    req.body.author = req.user._id;
    const band = await Band.create(req.body);
    band._doc.author = req.user;
    res.status(201).json(band);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const bands = await Band.find({})
      .populate('author')
      .sort({ createdAt: 'desc' });
    res.status(200).json(bands);
  } catch (error) {
    res.status(500).json(error);
  }
});


router.get('/:bandId', verifyToken, async (req, res) => {
  try {
    const band = await Band.findById(req.params.bandId).populate([
      'author',
    ]);
    if (!band) {
      return res.status(404).json({ err: 'Band not found.' });
    }
    res.status(200).json(band);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});


router.put('/:bandId', verifyToken, async (req, res) => {
  try {
    // Find the band:
    const band = await Band.findById(req.params.bandId);

    // Check permissions:
    if (!band.author.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    // Update band:
    const updatedBand = await Band.findByIdAndUpdate(
      req.params.bandId,
      req.body,
      { new: true }
    );

    // Append req.user to the author property:
    updatedBand._doc.author = req.user;

    // Issue JSON response:
    res.status(200).json(updatedBand);
  } catch (error) {
    res.status(500).json(error);
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
    res.status(500).json(error);
  }
});

module.exports = router;