const chalk = require("chalk");
const Permissions = require("../statics/permissions");
const Roles = require("../statics/roles");
const UserModel = require("../db/models/user.model");
const { isStrongPassword } = require("../utils/helpers");
const AUTH = require("../services/auth");
const USERS = require("../services/users");

const registerUser = async (req, res, type) => {
  try {
    if (type === Roles.user) {
      if (
        !(
          req.userRole.type === Roles.quizCreator ||
          req.userRole.type === Roles.admin
        )
      ) {
        return AUTH.requestDenied(res);
      }
    }
    const userData = req.body;
    console.log(userData);
    if (!userData) {
      return USERS.creationFailed(res, "Invalid details provided");
    }
    if (!isStrongPassword(userData.password)) {
      return USERS.creationFailed(res, "Password not strong enough!");
    }
    const user = new UserModel({
      ...userData,
      type: type,
    });
    if (type === Roles.quizCreator) {
      console.log(type)
      // if(!req.userRole.type === Roles.admin){
      //       return AUTH.requestDenied(res)     // Need to add this for giving access only to admin
      //    }
      const token = await user.generateAuthToken(); 
      if (!token) {
        throw new Error();
      }
      return USERS.created(res, {
        user,
        token,
      });
    }
    if (type === Roles.admin) {
      //throw new Error();
      const token = await user.generateAuthToken(); 
      if (!token) {
        throw new Error();
      }
      return USERS.created(res, {
        user,
        token,
      });
    }
    await user.save();
    return USERS.created(res, { user });
  } catch (err) {
    console.log(err);
    return USERS.creationFailed(res);
  }
};

const registerQuizCreator = async (req, res, next) => {
  await registerUser(req, res, Roles.quizCreator);
};

const registerGenericUser = async (req, res, next) => {
  await registerUser(req, res, Roles.user);
};

const registerAdmin = async (req, res, next) => {
  await registerUser(req, res, Roles.admin);
};

const loginUser = async (req, res, next) => {
  try {
    const user = await UserModel.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    USERS.loggedIn(res, { user, token });
  } catch (err) {
    console.log(err);
    return USERS.loginFailed(res);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    console.log(req.userType, "logging out ");
    const tokens = req.user.tokens;
    tokens.filter((token) => token.token != req.token);
    req.user.tokens = tokens;
    await req.user.save();
    USERS.loggedOut(res);
  } catch (err) {
    console.log(err);
    USERS.logoutFailed(res);
  }
};

const logoutFromAllDevices = async (req, res, next) => {
  try {
    req.user.tokens = undefined;
    await req.user.save();
    USERS.loggedOut(res);
  } catch (err) {
    console.log(err);
    USERS.logoutFailed(res);
  }
};

const deleteUserByEmail = async (req, res, next) => {
  try {
    if (!req.userRole.permissions.includes(Permissions.removeUser)) {
      return AUTH.requestDenied(res);
    }
    const user = await UserModel.findOne({ email: req.params.email });
    if (!user) {
      return USERS.deleteFailed(res, "User not found");
    }
    await user.remove()
    if (user.type === Roles.admin && user.email != req.user.email) {
      console.log(chalk.redBright.bold("Admin deletion is prohibited"));
      return AUTH.requestDenied(res);
    }
    return USERS.deleted(res, {user: user});
  } catch (err) {
    console.log(err);
    return USERS.deleteFailed(res);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["email", "firstName", "lastName", "password"];
    const isValidUpdate = allowedUpdates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isValidUpdate) {
      return USERS.updateFailed(res, "Invalid update");
    }
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    return USERS.updated(res, {user: req.user});
  } catch (err) {
    console.log(err);
    return USERS.updateFailed(res);
  }
};

module.exports = {
  registerQuizCreator,
  registerGenericUser,
  registerAdmin,
  loginUser,
  logoutUser,
  logoutFromAllDevices,
  deleteUserByEmail,
  updateUser,
};
