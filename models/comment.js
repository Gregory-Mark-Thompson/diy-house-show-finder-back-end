const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);