const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }
  },
  { timestamps: true }
);

commentSchema.virtual('children', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parent'
});

commentSchema.set('toObject', { virtuals: true });
commentSchema.set('toJSON', { virtuals: true });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;