const mongoose = require("mongoose");
const ScoreModel = require("./scoreboard.model");
const QuizTimeConstraintModel = require("./timeConstraint.model");
const UserModel = require("./user.model");

/**  Options Schema :-
 *
 * This Schema will define the types of options given to the user.
 * Base version for MCQ it is decided .
 * Future work : adding text options and multiple options
 */

const OptionSchema = mongoose.Schema({
  option: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
});
/** Question Schema :-
 * This schema defines the questions present in the quiz.
 * Base version for MCQ is added
 * Future work : Need to make for Text answer and Multiple choice
 */

const QuestionSchema = mongoose.Schema(
  {
    type: {
      type: String,
      default: "MCQ", //Type of question ; MCQ, TEXT , Multiple
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answers: [OptionSchema], //options provided

    answer: {
      type: Number, // Answer specific to single answer MCQ
      required: true,
    },

    isEnabled: {
      type: Boolean, // While Creating questions user can disable questions
      default: true,
    },

    explanation: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

/**Activity Schema
 * To say the status of the quiz .
 * Doubts: Choosing required element
 */

// const activitySchema = mongoose.Schema({
//     isEnabled: {
//         type: Boolean,
//         default: false
//     },
//     isCompleted: {
//         type: Boolean,
//         default: false
//     },
//     inDraft: {            // future work isText
//         type: Boolean,
//         default: true
//     },

// })

const QuizSchema = mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Users",
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },

    instructions: {
      type: String,
      required: true,
    },

    questions: [QuestionSchema],
    activityStatus: {
      type: Number,
      default: 0,
      required: true, // draft =0 , active =1 , completed = 2
    },

    duration: {
      type: Number, //if needed
      default: 0,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

QuizSchema.methods.toJSON = function () {
  const quiz = this;
  const quizObj = quiz.toObject();
  delete quizObj.questions;
  return quizObj;
};

QuizSchema.pre('remove', async function(next) {
  const quiz = this
  console.log("called pre remove")
  await ScoreModel.deleteMany({quizId: quiz._id})
  await QuizTimeConstraintModel.deleteMany({quizId: quiz._id})
  next()
})

var QuizModel = mongoose.model("Quizzes", QuizSchema);

module.exports = QuizModel;
