const express = require('express');
const mongoose = require('mongoose');
const verifyToken = require('../middleware/verify-token.js');
const Gig = require('../models/gig.js');
const Comment = require('../models/comment.js');
const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
  try {
    req.body.author = req.user._id;
    const gig = await Gig.create(req.body);
    await gig.populate('author');
    res.status(201).json(gig);
  } catch (error) {
    console.error('POST /gigs error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const gigs = await Gig.find({})
      .populate('author')
      .sort({ createdAt: 'desc' });
    res.status(200).json(gigs);
  } catch (error) {
    console.error('GET /gigs error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:gigId', verifyToken, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId).populate('author');
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    res.status(200).json(gig);
  } catch (error) {
    console.error('GET /:gigId error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:gigId', verifyToken, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (!gig.author.equals(req.user._id)) return res.status(403).json({ error: "Not authorized" });
    const updatedGig = await Gig.findByIdAndUpdate(req.params.gigId, req.body, { new: true });
    await updatedGig.populate('author');
    res.status(200).json(updatedGig);
  } catch (error) {
    console.error('PUT /:gigId error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:gigId', verifyToken, async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (!gig.author.equals(req.user._id)) return res.status(403).json({ error: "Not authorized" });
    await Comment.deleteMany({ gig: req.params.gigId }); // Clean up comments
    const deletedGig = await Gig.findByIdAndDelete(req.params.gigId);
    res.status(200).json(deletedGig);
  } catch (error) {
    console.error('DELETE /:gigId error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:gigId/comments', verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.gigId)) {
      return res.status(400).json({ error: 'Invalid gigId' });
    }
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    const isGigAuthor = gig.author.equals(req.user._id);
    let query = { gig: req.params.gigId, parent: null };
    if (!isGigAuthor) query.author = req.user._id;
    const comments = await Comment.find(query)
      .populate({
        path: 'author',
        select: 'username', // Only fetch username to avoid issues with invalid author data
      })
      .populate({
        path: 'children',
        populate: [
          { path: 'author', select: 'username' },
          {
            path: 'children',
            populate: { path: 'author', select: 'username' }, // 2 levels deep
          },
        ],
      })
      .sort({ createdAt: 'asc' });
    res.status(200).json(comments);
  } catch (error) {
    console.error('GET /:gigId/comments error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch comments', details: error.message });
  }
});

router.post('/:gigId/comments', verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.gigId)) {
      return res.status(400).json({ error: 'Invalid gigId' });
    }
    if (!req.body.text || typeof req.body.text !== 'string' || req.body.text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    let parent = null;
    let topLevelAuthor = req.user._id;
    if (req.body.parent) {
      if (!mongoose.Types.ObjectId.isValid(req.body.parent)) {
        return res.status(400).json({ error: 'Invalid parent comment ID' });
      }
      parent = await Comment.findById(req.body.parent);
      if (!parent || !parent.gig.equals(req.params.gigId)) {
        return res.status(400).json({ error: 'Invalid parent comment' });
      }
      let current = parent;
      while (current.parent) {
        current = await Comment.findById(current.parent);
      }
      topLevelAuthor = current.author;
      if (!gig.author.equals(req.user._id) && !topLevelAuthor.equals(req.user._id)) {
        return res.status(403).json({ error: 'Not authorized to reply in this thread' });
      }
    }
    const comment = await Comment.create({
      text: req.body.text,
      author: req.user._id,
      gig: req.params.gigId,
      parent: req.body.parent || null,
    });
    await comment.populate('author', 'username');
    res.status(201).json(comment);
  } catch (error) {
    console.error('POST /:gigId/comments error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create comment', details: error.message });
  }
});

router.put('/:gigId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment || !comment.gig.equals(req.params.gigId)) return res.status(404).json({ error: 'Comment not found' });
    if (!comment.author.equals(req.user._id)) return res.status(403).json({ error: 'Not authorized' });
    comment.text = req.body.text;
    await comment.save();
    res.status(200).json(comment);
  } catch (error) {
    console.error('PUT /:gigId/comments/:commentId error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:gigId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment || !comment.gig.equals(req.params.gigId)) return res.status(404).json({ error: 'Comment not found' });
    if (!comment.author.equals(req.user._id)) return res.status(403).json({ error: 'Not authorized' });
    await Comment.deleteMany({ _id: { $in: await getAllChildrenIds(comment) } }); // Delete thread children
    await comment.deleteOne();
    res.status(200).json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('DELETE /:gigId/comments/:commentId error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Helper to get all child IDs recursively
async function getAllChildrenIds(comment) {
  await comment.populate('children');
  let ids = [comment._id];
  for (let child of comment.children) {
    ids = ids.concat(await getAllChildrenIds(child));
  }
  return ids;
}

module.exports = router;