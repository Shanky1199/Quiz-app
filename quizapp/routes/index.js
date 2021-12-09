var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.status(200).send("<h1>Brace yourself quizzes😉<h1>");
});

module.exports = router;
