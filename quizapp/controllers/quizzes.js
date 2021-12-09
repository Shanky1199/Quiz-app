const Permissions = require("../statics/permissions");
const Status = require("../statics/status");
const QuizModel = require("../db/models/quizzes.model");
const UserModel = require("../db/models/user.model");
const ScoreModel = require("../db/models/scoreboard.model");
const Roles = require("../statics/roles");
const AUTH = require("../services/auth");
const QUIZZES = require("../services/quizzes");
const QuizTimeConstraintModel = require("../db/models/timeConstraint.model");
const mongoose = require("mongoose");

/**
 * Below All Get Request functions 
 */

const getQuizByName = async (req, res) => {
  try {
    if (
      req.userRole.permissions.includes(Permissions.quizCreator) ||
      req.userRole.type === Roles.admin
    ) {
      const quiz = await QuizModel.findOne({ name: req.params.name });
      console.log(
        "role: ",
        req.userRole.type,
        ", requested user ID: ",
        req.user._id,
        ", quiz creator ID: ",
        quiz.creatorId
      );
      if (
        req.userRole.type === Roles.admin ||
        req.user._id.toString() == quiz.creatorId.toString()
      ) {
        console.log("is authorized to access complete quiz data");
        if (!quiz) {
          return QUIZZES.quizMatchError(res);
        }
        const questions = quiz.questions;
        const quizToSend = quiz.toObject();
        quizToSend.questions = questions;
        return QUIZZES.success(res, (msg = "Quizzes fetched"), quizToSend);
      }
      else{
        return AUTH.unauthorizedAccess(res)
      }
    }
    else{
      const quiz = await QuizModel.findOne({ name: req.params.name }).lean();
      console.log("quiz status: ", Status.active)
      if(quiz.activityStatus != Status.active)
      {
        return AUTH.unauthorizedAccess(res)
      }
      //new mongoose.Schema.Types.ObjectId(quiz._id)
      const doesTimestampExists = await QuizTimeConstraintModel.findOne({quizId: quiz._id, userId: req.user._id})
      if(doesTimestampExists){
        return QUIZZES.badRequest(res, "You've already started the quiz")
      }
      
      const questions = quiz.questions.filter((que) => {
        if (que.isEnabled) {
          que.isEnabled = undefined;
          delete que.answer;
          const answers = que.answers.map((ans) => {
            delete ans.isCorrect;
            console.log("answer: ", ans);
            return ans;
          });
          que.answers = answers;
          return que;
        }
      });
      quiz.questions = questions;
      const duration = new QuizTimeConstraintModel({
        userId: req.user._id,
        quizId: mongoose.Types.ObjectId(quiz._id),
        startTime: Date.now(),
      });
      await duration.save();
      return QUIZZES.success(res, (msg = "Quizzes fetched"), quiz);
    }
  } catch (err) {
    console.log(err);
    return QUIZZES.handle500Error(res, (msg = "sorry cannot get your quiz"));
  }
};

const getScore = async (req, res, next) => {
  try {
    let scoreBoards;
    if (!req.query.quizName) {
      const options = {};
      const sort = {};
      if (req.query.limit) {
        options.limit = parseInt(req.query.limit, 10);
      }
      if (req.query.page) {
        options.skip = parseInt(req.query.page, 10) - 1;
      }
      scoreBoards = await ScoreModel.find({ userId: req.user._id }, {}, { ...options, sort }).sort({
        score: "desc",
      });
    } else {
      const match = {};

      console.log(req.query);
      
      if (req.query.sortBy) {
        let orderBy = 1;
        if (req.query.orderBy) {
          orderBy = req.query.orderBy === "asc" ? 1 : -1;
        }
        sort[req.query.sortBy] = orderBy;
      }
      match.userId = req.user._id;
      console.log("quiz name: ", req.query.quizName)
      const quiz = await QuizModel.findOne({ name: req.query.quizName });
      console.log("Quiz: ", quiz)
      match.quizId = quiz._id;
      console.log("match: ", match)
      if (!quiz) {
        return QUIZZES.badRequest(res, "Quiz doesn't exist!");
      }
      scoreBoards = await ScoreModel.find(match);
      console.log("Score boards: ", scoreBoards)
    }
    const scoreBoardsPromisses = scoreBoards.map(
      async (scoreBoard) => await scoreBoard.populate()
    );
    const scoreBoardData = await Promise.all(scoreBoardsPromisses);
    return QUIZZES.success(res, scoreBoardData, (msg = "Scoreboard"));
  } catch (err) {
    console.log(err);
    return QUIZZES.handle500Error(res, (msg = "Couldn't fetch scores"));
  }
};

const getQuestion = async (req, res, next) => {
  try {
    if (!req.userRole.permissions.includes(Permissions.quizCreator)) {
      return AUTH.requestDenied(res);
    }
    const quizName = req.params.quiz;
    const question = req.params.question;
    console.log("name: ", quizName);
    if (!question) {
      return QUIZZES.badRequest(res, (msg = "Please enter a valid question"));
    }
    const quiz = await QuizModel.findOne({ name: quizName });
    if (!quiz) {
      return QUIZZES.quizMatchError(res);
    }
    if (quiz.questions.length <= 0) {
      return QUIZZES.badRequest(res, (msg = "Could not find any question "));
    }
    const questions = quiz.questions.filter(
      (que) => que.question === req.params.question
    );
    if (questions.length <= 0) {
      return QUIZZES.badRequest(res, (msg = "Could not find any question "));
    }
    return QUIZZES.success(res, (msg = "This is the Question"), questions[0]);
  } catch (err) {
    return QUIZZES.handle500Error(res, (msg = "Could Not fetch the quiz"));
  }
};

const getAllQuestions = async (req, res, next) => {
  try {
    if (!req.userRole.permissions.includes(Permissions.quizCreator)) {
      return AUTH.requestDenied(res);
    }
    const quizName = req.params.quiz;
    const quiz = await QuizModel.findOne({ name: quizName });
    if (!quiz) {
      return QUIZZES.quizMatchError(res);
    }
    const questions = quiz.questions;
    return QUIZZES.success(
      res,
      (msg = "All questions of that particular Quiz"),
      questions
    );
  } catch (err) {
    return QUIZZES.handle500Error(res, (msg = "Couldn't get the questions"));
  }
};

const searchQuizzes = async (req, res, next) => {
  ///quizzes?limit=2&page=1&sortBy=firstName:desc&match=field1:value,value2,valueN|field2:value1,value2,valueN
  try {
    const allowedFields = ["name"];

    const match = {};
    const options = {};
    const sort = {};

    console.log(req.query);
    if (req.query.limit) {
      options.limit = parseInt(req.query.limit, 10);
    }
    if (req.query.page) {
      options.skip = parseInt(req.query.page, 10) - 1;
    }
    if (req.query.sortBy) {
      let orderBy = 1;
      if (req.query.orderBy) {
        orderBy = req.query.orderBy === "asc" ? 1 : -1;
      }
      const parts = req.query.sortBy.split("_");
      sort[parts[0]] = orderBy;
    }

    if (req.query.match) {
      const parts = req.query.match.split(",");
      console.log(parts);
      parts.forEach((part) => {
        const keyValue = part.split(":");
        if (!allowedFields.includes(keyValue[0])) {
          return;
        }
        match[keyValue[0]] = { $regex: keyValue[1] };
      });
    }

    if (req.query.status) {
      match.activityStatus = parseInt(req.query.status);
    }
    // if (!req.userRole.permissions.includes(Permissions.quizCreator)) {
    //   return res
    //     .status(400)
    //     .send("Request denied! Allowed only for Quiz Creator");
    // }
    if (!req.user.type === Roles.user) {
      match.activityStatus = Status.active;
    }

    console.log("Match: ", match);
    const quizzes = await QuizModel.find(match, {}, { ...options, sort });
    if (!quizzes) {
      //throw new Error("No quizzes found!");
      QUIZZES.quizMatchError(res);
    }
    //return res.status(200).send({ data: quizzes });
    return QUIZZES.success(res, (msg = "Quizzes found"), quizzes);
  } catch (err) {
    return QUIZZES.handle500Error(res, (msg = "Failed to Search your quiz "));
  }
};

const report = async (req, res, next) => {
  try {
    const quizName = req.params.quizName;
    console.log("Role %%$$: ", req.userRole.type);
    if (
      !(
        req.userRole.type == Roles.quizCreator ||
        req.userRole.type == Roles.admin
      )
    ) {
      return AUTH.insufficientPermissions(res); // user permission
    }
    const quiz = await QuizModel.findOne({name: quizName})
    if(!quiz){
      return QUIZZES.badRequest(res, "Quiz not found")
    }
    const scores = await ScoreModel.find(
      { quizId: quiz._id },
      {},
      { limit: 5, sort: { score: -1 } }
    );
    return QUIZZES.success(res, "Top 5 Scoreboard", scores);
  } catch (err) {
    console.log(err);
    return QUIZZES.handle500Error(res, (msg = "No Matching Scores Found"));
  }
};
/**
 * Below ALl Post Request Functions 
 */

const createQuiz = async (req, res) => {
  try {
    const quizData = req.body;
    const creatorId = req.user._id;
    console.log(quizData.name);
    console.log("creatorId: ", creatorId);
    if (!quizData) {
      return QUIZZES.badRequest(res, "Please enter valid quiz data");
    }
    if (!req.userRole.permissions.includes(Permissions.quizCreator)) {
      return AUTH.requestDenied(res);
    }
    const quiz = new QuizModel({ creatorId, ...quizData });
    await quiz.save();
    return QUIZZES.success(res, "Quiz created", quiz);
  } catch (err) {
    return QUIZZES.handle500Error(res, "Failed to create the quiz ");
  }
};

const addQuestion = async (req, res, next) => {
  try {
    if (!req.userRole.permissions.includes(Permissions.quizCreator)) {
      return AUTH.requestDenied(res);
    }
    const quiz = await QuizModel.findOne({ name: req.params.quiz });
    if (!quiz) {
      return QUIZZES.quizMatchError(res);
    }
    if (quiz.creatorId.toString() !== req.user._id.toString()) {
      console.log(
        "Quiz doesn't belong to this user, requested user ID: ",
        req.user._id,
        ", quiz creator ID: ",
        quiz.creatorId
      );
      return AUTH.insufficientPermissions(res);
    }
    quiz.questions.forEach((que) => {
      console.log("checking duplicate question");
      if (que.question == req.body.question) {
        console.log("duplicate found");
        throw new Error("duplicate question");
      }
    });
    quiz.questions = quiz.questions.concat(req.body);
    await quiz.save();
    return QUIZZES.success(res, (msg = "Question added"), quiz.questions);
  } catch (err) {
    return QUIZZES.handle500Error(res, (msg = "Could not add the questions"));
  }
};

const participateInQuiz = async (req, res, next) => {
  try {
    var totalScore = 0;
    var item = 0;
    const userAnswer = req.body.answers;
    if (!req.userRole.permissions.includes(Permissions.participate)) {
      return AUTH.insufficientPermissions(res);
    }
    const quiz = await QuizModel.findOne({ name: req.body.name });
    console.log("Quiz: ", quiz)
    if (!quiz) {
      QUIZZES.quizMatchError(res);
    }
    const startTime = (
      await QuizTimeConstraintModel.findOne({
        userId: req.user._id,
        quizId: quiz._id,
      })
    ).startTime;
    if (!startTime) {
      return QUIZZES.badRequest(res, (msg = "No start time found"));
    }
    if (quiz.duration > 0) {
      const submissionTimeDuration = Math.round(
        (((new Date() - startTime) % 86400000) % 3600000) / 60000
      );
      console.log(
        "time difference: ",
        submissionTimeDuration,
        ", quizDuration: ",
        quiz.duration
      );

      if (quiz.duration < submissionTimeDuration) {
        return QUIZZES.badRequest(
          res,
          "Couldn't submit your response!, Submissions closed"
        );
      }
    }
    const attempts = await ScoreModel.findOne({
      userId: req.user._id,
      quizId: quiz._id,
    });
    if (attempts) {
      return QUIZZES.badRequest(
        res,
        (msg = "You can attempt the quiz only once")
      );
    }
    const allQuestions = quiz.questions;
    console.log("all questions: ", allQuestions)
    for (var question of allQuestions) {
      var score = 0;
      console.log("question: ", question)
      score = validateAnswer(question, userAnswer[item]);
      if (score == -1) {
        return res.status(400).send({
          message: "Sorry wrong type on question" + question.question,
        });
      }
      console.log(score + "this is the score on " + item + "question");
      item = item + 1;

      totalScore = totalScore + score;
    }
    // Saving the score in the database for that user
    const saveScore = new ScoreModel({
      userId: req.user._id,
      quizId: quiz._id,
      score: totalScore,
    });
    await saveScore.save();
    return QUIZZES.success(res, `Score saved`, totalScore);
  } catch (err) {
    console.log(err);
    QUIZZES.handle500Error(res, (msg = "Failed to  Process your Application"));
  }
};

/**
 * Below All Delete request functions  
 */
const deleteQuiz = async (req, res) => {
  try {
    if (!req.userRole.permissions.includes(Permissions.quizDelete)) {
      return AUTH.requestDenied(res);
    }
    const quiz = await QuizModel.findOne({ name: req.params.quiz });
    if (!quiz) {
      return QUIZZES.quizMatchError(res);
    }
    if (quiz.activityStatus == Status.active) {
      return QUIZZES.badRequest(res, (msg = "Quiz is Active! Access Denied"));
    }
    console.log("Deleting Quiz now");
    const toDelete = await QuizModel.findOne({ name: quiz.name });
    await toDelete.remove()
    return QUIZZES.success(res, quiz.name, (msg = "Quiz deleted successfully"));
  } catch (err) {
    console.log(err)
    return QUIZZES.handle500Error(
      res,
      (msg = "Could not delete your quiz sorry")
    );
  }
};

const removeQuizzes = async (req, res, next) => {
  /**
   * Payload
   * email : "" //to delete that creator quiz
   * all : false //default false , if u wanna delete all quiz make it True
   * isCompleted : false //default false  if u wanna delete completed quiz --> True
   */
  try {
    console.log("Deleting quizzes 0")
    const userEmail = req.query.email;
    const all = req.query.all; // delete all completed whole quiz
    const isCompleted = req.query.isCompleted;
    if (req.userRole.type !== Roles.admin) {
      return AUTH.requestDenied(res);
    }
    if (userEmail) {
      console.log("Deleting quizzes 1")
      const user = await UserModel.findOne({ email: userEmail });
      console.log(user.firstName, user.type, Roles.quizCreator);
      if (!(user.type == Roles.quizCreator)) {
        return QUIZZES.badRequest(
          res,
          (msg = "Sorry email Must be of the quiz Creator")
        );
      }
      const creatorId = user._id;
      console.log("Deleting quizzes 1")
      const quizzes = await QuizModel.find({ creatorId: creatorId });
      const quizzesToDelete = quizzes.map(async (quiz) => await quiz.remove())
      console.log("Quizzes to delete: ", quizzesToDelete)
      await Promise.all(quizzesToDelete)
      return QUIZZES.success(
        res,
        user.email,
        (msg = "All Quiz related to this user is deleted")
      );
    }
    if (all) {
      const quizzes = await QuizModel.find({});
      const quizzesToDelete = quizzes.map(async (quiz) => await quiz.remove())
      await Promise.all(quizzesToDelete)
      return QUIZZES.success(res, (msg = "All Quiz Deleted By The Authority"));
    }
    if (isCompleted) {
      const quizzes = await QuizModel.find({ activityStatus: Status.completed });
      const quizzesToDelete = quizzes.map(async (quiz) => await quiz.remove())
      console.log("Quizzes to delete: ", quizzesToDelete)
      await Promise.all(quizzesToDelete)
      return QUIZZES.success(res, (msg = "All Completed Quiz Deleted"));
    }
  } catch (err) {
    console.log(err)
    return QUIZZES.handle500Error(res, (msg = "Failed to remove all Quiz"));
  }
};

const removeQuestion = async (req, res, next) => {
  try {
    if (!req.userRole.permissions.includes(Permissions.quizCreator)) {
      return AUTH.requestDenied(res);
    }
    const quiz = await QuizModel.findOne({ name: req.params.quiz });
    if (!quiz) {
      return QUIZZES.quizMatchError(res);
    }
    console.log("Quiz creator: ", quiz.creatorId.toString(), "request by: ", req.user._id.toString())
    if (quiz.creatorId.toString() !== req.user._id.toString()) {
      console.log(
        "Quiz doesn't belong to this user, requested user ID: ",
        req.user._id,
        ", quiz creator ID: ",
        quiz.creatorId
      );
      return AUTH.insufficientPermissions(res);
    }
    const questions = quiz.questions.filter(
      (que) => que.question != req.params.question
    );
    quiz.questions = questions;
    await quiz.save();
    return QUIZZES.success(res, (msg = "Question Removed"));
  } catch (err) {
    return QUIZZES.handle500Error(res, (msg = "Could not remove the question"));
  }
};

const removeAllQuestions = async (req, res, next) => {
  try {
    if (!req.userRole.permissions.includes(Permissions.quizCreator)) {
      return AUTH.requestDenied(res);
    }
    const quiz = await QuizModel.findOne({ name: req.params.quiz });
    if (!quiz) {
      return QUIZZES.quizMatchError(res);
    }
    if (quiz.creatorId.toString() !== req.user._id.toString()) {
      console.log(
        "Quiz doesn't belong to this user, requested user ID: ",
        req.user._id,
        ", quiz creator ID: ",
        quiz.creatorId
      );
      return AUTH.insufficientPermissions(res);
    }
    quiz.questions = undefined;
    await quiz.save();
    return QUIZZES.success(res, (msg = "Questions Removed"));
  } catch (err) {
    return QUIZZES.handle500Error(
      res,
      (msg = "Failed to Remove all questions ")
    );
  }
};

/**
 * Below All update Request Functions 
 */

const updateQuestion = async (req, res, next) => {
  try {
    if (!req.userRole.permissions.includes(Permissions.quizCreator)) {
      return AUTH.requestDenied(res);
    }
    const quiz = await QuizModel.findOne({ name: req.params.quiz });
    if (!quiz) {
      return QUIZZES.quizMatchError(res);
    }
    if (quiz.creatorId.toString() !== req.user._id.toString()) {
      console.log(
        "Quiz doesn't belong to this user, requested user ID: ",
        req.user._id,
        ", quiz creator ID: ",
        quiz.creatorId
      );
      return AUTH.insufficientPermissions(res);
    }
    const questions = quiz.questions.map((que) => {
      if (que.question == req.params.question) {
        que = { ...que.toObject(), ...req.body };
      }
      return que;
    });
    quiz.questions = questions;
    await quiz.save();
    return QUIZZES.success(res, (msg = "Questions Updated"));
  } catch (err) {
    return QUIZZES.handle500Error(
      res,
      (msg = "Failed to Update the question ")
    );
  }
};

const updateQuiz = async (req, res) => {
  console.log(req.body);
  try {
    const allowedUpdates = ["name", "instructions", "duration"];
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every((update) =>
      allowedUpdates.includes(update)
    );
    console.log("isValidUpdate: ", isValidUpdate);
    if (!isValidUpdate) {
      return QUIZZES.badRequest(res, (msg = "Not a valid update "));
    }
    if (!req.userRole.permissions.includes(Permissions.quizCreator)) {
      return AUTH.requestDenied(res);
    }
    const quiz = await QuizModel.findOne({ name: req.params.quiz });
    console.log("quiz: ", quiz);
    if (!quiz) {
      return QUIZZES.quizMatchError(res);
    }
    if (quiz.creatorId.toString() !== req.user._id.toString()) {
      console.log(
        "Quiz doesn't belong to this user, requested user ID: ",
        req.user._id,
        ", quiz creator ID: ",
        quiz.creatorId
      );
      return AUTH.insufficientPermissions(res);
    }
    updates.forEach((update) => {
      quiz[update] = req.body[update];
    });
    await quiz.save();
    return QUIZZES.success(res, (msg = "Quiz is Updated "), quiz);
  } catch (err) {
    return QUIZZES.handle500Error(res, (msg = "Failed to Update your Quiz "));
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!req.userRole.permissions.includes(Permissions.quizCreator)) {
      return AUTH.requestDenied(res);
    }
    const quiz = await QuizModel.findOne({ name: req.params.quiz });
    console.log(quiz.name, "This is the name of quiz");
    if (!quiz) {
      return QUIZZES.quizMatchError(res);
    }
    if (quiz.creatorId.toString() !== req.user._id.toString()) {
      console.log(
        "Quiz doesn't belong to this user, requested user ID: ",
        req.user._id,
        ", quiz creator ID: ",
        quiz.creatorId
      );
      return AUTH.insufficientPermissions(res);
    }
    if (status in [0, 1, 2]) {
      quiz.activityStatus = status;
      console.log("Breakpoint");
      await quiz.save();
      return QUIZZES.success(res, (msg = "Updated quiz status successfully"));
    }
    return QUIZZES.badRequest(res, (msg = "Could not update your status "));
  } catch (err) {
    return QUIZZES.handle500Error(
      res,
      (msg = "Failed to find the matching quizzes")
    );
  }
};


/* 
* Below all Necessary functions (others)
*/

const validateAnswer = (question, userAnswer) => {
  console.log("called validate answer!!")
  var score = 0;
  const type = question.type;
  const answerList = question.answers;
  const correctAnswer = question.answer;
  if (type == userAnswer.type) {
    if (userAnswer.type == "MCQ") {
      console.log("user answer: ", userAnswer, ", correct answer: ", correctAnswer)
      if (userAnswer.answer == answerList[correctAnswer - 1].option) {
        score = score + 1;
      }
    }
    if (userAnswer.type == "MULTIPLE") {
      var countOfCorrect = 0;
      var tempScore = 0;
      answerList.forEach((option) => {
        if (option.isCorrect) {
          countOfCorrect += 1;
          console.log(userAnswer.answer.includes(option.option));
          if (userAnswer.answer.includes(option.option)) {
            console.log("entering counting temp");
            tempScore = tempScore + 1;
          }
        }
      });
      if (tempScore == countOfCorrect) {
        score = 1;
      }
      console.log(countOfCorrect + "this is the number of correct" + tempScore);
    }
    if (userAnswer.type == "TEXT") {
      console.log("Executing text answer validation");
      console.log(
        "userAnswer: ",
        userAnswer.answer[0],
        ", actualAnswer: ",
        answerList[0].option,
        ", isEqual: ",
        userAnswer.answer[0] == answerList[0].option
      );
      if (userAnswer.answer[0] == answerList[0].option) {
        console.log("increment score");
        score += 1;
      }
    }
    return score;
  } else {
    return -1;
  }
};
/*  This below function is extras : to generate a random username just like rpm */
// have to be used in future updates.
// code improvement required after testing and usage

const usernameAuto = async (req,res,next)=>{
  const max= 100
  const min =0 
  const generateBody = req.body
  const username = generateBody.firstName + generateBody.lastName[0]
  const randomNumber = Math.floor(
    Math.random() * (max - min + 1) + min
  )
  proposedName = username +randomNumber
  async function generateUniqueName(proposedName){
  return await UserModel.findOne({username: proposedName})
  .then(function(account) {
    if (account) {
      console.log(' Exist please  try again: ' + proposedName);
      proposedName += Math.floor((Math.random() * (max-min+1)) + 1);
      return generateUniqueName(proposedName); 
    }
    console.log('proposed name is unique' + proposedName);
    return proposedName;
  })
  .catch(function(err) {
    console.error(err);
    throw err;
  });
 }
 const finalName = generateUniqueName(proposedName)

 return finalName
}

module.exports = {
// GET
  getQuizByName,
  getScore,
  report,
  getQuestion,
  getAllQuestions,
  searchQuizzes,
// POST
  createQuiz,
  addQuestion,
  participateInQuiz,
// DELETE
  deleteQuiz,
  removeQuestion,
  removeAllQuestions,
  removeQuizzes,
// PATCH OR PUT
  updateQuestion,
  updateQuiz,
  updateStatus, 
};
