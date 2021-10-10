const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  username: String,
});

const ExerciseSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  duration: Number,
  description: String,
});

const User = mongoose.model('User', UserSchema);
const Exercise = mongoose.model('Exercise', ExerciseSchema);

module.exports = { User, Exercise };
