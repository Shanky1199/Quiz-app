var express = require("express");
const {
  getQuestion,
  getAllQuestions,
  addQuestion,
  removeQuestion,
  removeAllQuestions,
  updateQuestion,
  createQuiz,
  deleteQuiz,
  searchQuizzes,
  getQuizByName,
  removeQuizzes,
  updateQuiz,
  updateStatus,
  participateInQuiz,
  getScore,
  report,
} = require("../controllers/quizzes");
const auth = require("../middlewares/auth");
var router = express.Router();

//get
router.get("/report/:quizName", auth, report);
router.get("/scores", auth, getScore);
router.get("/", auth, searchQuizzes);
router.get("/:name", auth, getQuizByName);
router.get("/:quiz/questions", auth, getAllQuestions);
router.get("/:quiz/:question", auth, getQuestion);

//post
router.post("/participate", auth, participateInQuiz);
router.post("/quiz", auth, createQuiz);
router.post("/:quiz", auth, addQuestion);

//delete
router.delete("/", auth, removeQuizzes);
router.delete("/:quiz", auth, deleteQuiz);
router.delete("/:quiz/questions", auth, removeAllQuestions);
router.delete("/:quiz/:question", auth, removeQuestion);

//patch
router.patch("/status/:quiz", auth, updateStatus);
router.patch("/:quiz", auth, updateQuiz);
router.patch("/:quiz/:question", auth, updateQuestion);

module.exports = router;
