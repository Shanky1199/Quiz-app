class QUIZZES {
  static quizMatchError = (res, msg = undefined) => {
    console.log(msg);
    res.status(404).send({ message: msg ? msg : "Quiz Not Found" });
  };
  static handle500Error = (res, msg = undefined) => {
    console.log(msg);
    res.status(500).send({ message: msg ? msg : "Quiz Not Found" });
  };
  static success = (res, msg = undefined, data) => {
    console.log(msg);
    res.status(200).send({ message: msg ? msg : "Success", data: data });
  };
  static badRequest = (res, msg = undefined) => {
    console.log(msg);
    res.status(400).send({ message: msg ? msg : "Bad Request" });
  };
}

module.exports = QUIZZES;
//
