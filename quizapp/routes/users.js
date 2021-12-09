var express = require("express");
const {
  loginUser,
  logoutUser,
  logoutFromAllDevices,
  deleteUserByEmail,
  registerGenericUser,
  registerQuizCreator,
  registerAdmin,
  updateUser,
} = require("../controllers/users");
const auth = require("../middlewares/auth");
var router = express.Router();

//post
router.post("/admin",registerAdmin);
router.post("/register",registerQuizCreator); //auth to be added if given admin only feature
router.post("/addUser", auth, registerGenericUser);
router.post("/login", loginUser);

//get
router.get("/logout", auth, logoutUser);
router.get("/logout/all", auth, logoutFromAllDevices);

//delete
router.delete("/:email", auth, deleteUserByEmail);

//patch
router.patch("/me", auth, updateUser);

module.exports = router;
