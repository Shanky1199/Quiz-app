const chalk = require("chalk");
const mongoose = require("mongoose");

const Role = require("../db/models/roles.model");
const Permissions = require("../statics/permissions");
const Roles = require("../statics/roles");

mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log("Connected to Database");
    rolesCollectionSetup();
  })
  .catch((err) => {
    console.log(chalk.redBright.bold("Couldn't connect to DB"));
    console.log(err);
  });

// Here is the initial admin task to setup roles .

function rolesCollectionSetup() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        type: Roles.user,
        permissions: [Permissions.participate],
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'User' to roles collection");
      });

      new Role({
        type: Roles.quizCreator,
        permissions: [
          Permissions.quizCreator,
          Permissions.addUsers
        ],
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'Quiz- Creator' to roles collection");
      });

      new Role({
        type: Roles.admin,
        permissions: [Permissions.addUsers, Permissions.removeUser, Permissions.quizDelete,
          Permissions.quizCreator,Permissions.participate],
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }
        console.log(typeof Permissions.removeUser, "type");
        console.log("added 'Admin' to roles collection");
      });
    }
  });
}
