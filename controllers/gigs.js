const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Gig = require('../models/gig.js');
const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
  try {
    req.body.author = req.user._id;
    const gig = await Gig.create(req.body);
    gig._doc.author = req.user;
    res.status(201).json(gig);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const gigs = await Gig.find({})
      .populate('author')
      .sort({ createdAt: 'desc' });
    res.status(200).json(gigs);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get('/:gigId', verifyToken, async (req, res) => {
  try {
    // populate author of gig and comments
    const gig = await Gig.findById(req.params.gigId).populate([
      'author',
      'comments.author',
    ]);
    res.status(200).json(gig);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.put('/:gigId', verifyToken, async (req, res) => {
  try {
    // Find the gig:
    const gig = await Gig.findById(req.params.gigId);

    // Check permissions:
    if (!gig.author.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    // Update gig:
    const updatedGig = await Gig.findByIdAndUpdate(
      req.params.gigId,
      req.body,
      { new: true }
    );

    // Append req.user to the author property:
    updatedGig._doc.author = req.user;

    // Issue JSON response:
    res.status(200).json(updatedGig);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.delete('/:gigId', verifyToken, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);

    if (!gig.author.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    const deletedGig = await Gig.findByIdAndDelete(req.params.gigId);
    res.status(200).json(deletedGig);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post('/:gigId/comments', verifyToken, async (req, res) => {
  try {
    req.body.author = req.user._id;
    const gig = await Gig.findById(req.params.gigId);
    gig.comments.push(req.body);
    await gig.save();

    // Find the newly created comment:
    const newComment = gig.comments[gig.comments.length - 1];

    newComment._doc.author = req.user;

    // Respond with the newComment:
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.put('/:gigId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    const comment = gig.comments.id(req.params.commentId);

    // ensures the current user is the author of the comment
    if (comment.author.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to edit this comment' });
    }

    comment.text = req.body.text;
    await gig.save();
    res.status(200).json({ message: 'Comment updated successfully' });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.delete('/:gigId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    const comment = gig.comments.id(req.params.commentId);

    // ensures the current user is the author of the comment
    if (comment.author.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to edit this comment' });
    }

    gig.comments.remove({ _id: req.params.commentId });
    await gig.save();
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
