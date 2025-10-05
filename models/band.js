const mongoose = require('mongoose');

const bandSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Rock', 'Metal', 'Punk', 'R&B', 'Rap', 'Techno/Electronic', 'Country', 'Folk/World'],
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Band = mongoose.model('Band', bandSchema);

module.exports = Band;