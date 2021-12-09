const mongoose = require("mongoose");

const QuizTimeConstraintSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Users",
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Quizzes",
  },
  startTime: {
    type: Date,
    required: true,
  },
});

var QuizTimeConstraintModel = mongoose.model(
  "QuizTimeConstraint",
  QuizTimeConstraintSchema
);

module.exports = QuizTimeConstraintModel;
