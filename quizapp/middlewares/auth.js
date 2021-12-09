const jwt = require("jsonwebtoken");
const RolesModel = require("../db/models/roles.model");
const UserModel = require("../db/models/user.model");

const auth = async (req, res, next) => {
  try {
    console.log("called");
    const token = req.header("Authorization").replace("Bearer ", "");
    console.log("token: ", token);
    const userData = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(userData._id);
    console.log("User: ", user);
    const role = await RolesModel.findOne({ type: user.type });
    console.log("Role: ", role);
    if (!user) {
      throw new Error();
    }
    if (!role) {
      throw new Error();
    }
    req.token = token;
    req.user = user;
    req.userRole = role;
    return next();
  } catch (err) {
    console.log(err);
    res.status(403).send("Authentication failed!");
  }
};

module.exports = auth;
