const mongoose = require("mongoose");

const scoreSchema = mongoose.Schema({
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
  score: {
    type: Number,
    required: true,
    default: 0,
  },
});

scoreSchema.methods.populate = async function () {
  const score = this;
  const scoreObj = score.toObject();
  const user = await UserModel.findOne({ _id: score.userId });
  scoreObj.userFirstName = user.firstName;
  scoreObj.userLastName = user.lastName;
  const quiz = await QuizModel.findOne({ _id: score.quizId });
  scoreObj.quizName = quiz.name;
  return scoreObj;
};

var ScoreModel = mongoose.model("ScoreBoard", scoreSchema);

module.exports = ScoreModel;
const QuizModel = require("./quizzes.model");
const UserModel = require("./user.model");