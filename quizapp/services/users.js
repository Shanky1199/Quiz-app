class USERS {
  static created = (res, user, msg = undefined) => {
    console.log(msg);
    res.status(201).send({ message: msg ? msg : "User created", ...user });
  };
  static creationFailed = (res, msg = undefined) => {
    console.log(msg);
    res.status(400).send({ message: msg ? msg : "Couldn't create the user" });
  };

  static updated = (res, user, msg = undefined) => {
    console.log(msg);
    res.status(200).send({ message: msg ? msg : "User updated", ...user });
  };
  static updateFailed = (res, msg = undefined) => {
    console.log(msg);
    res.status(400).send({ message: msg ? msg : "User update failed" });
  };

  static deleted = (res, user, msg = undefined) => {
    console.log(msg);
    res.status(200).send({ message: msg ? msg : "User deleted", ...user });
  };
  static deleteFailed = (res, msg = undefined) => {
    console.log(msg);
    res.status(400).send({ message: msg ? msg : "User deletion failed" });
  };

  static loggedIn = (res, user, msg = undefined) => {
    console.log(msg);
    res.status(200).send({ message: msg ? msg : "Logged in", ...user });
  };
  static loginFailed = (res, msg = undefined) => {
    console.log(msg);
    res.status(400).send({ message: msg ? msg : "Login failed" });
  };

  static loggedOut = (res, user, msg = undefined) => {
    console.log(msg);
    res.status(200).send({ message: msg ? msg : "Logged out", ...user });
  };
  static logoutFailed = (res, msg = undefined) => {
    console.log(msg);
    res.status(400).send({ message: msg ? msg : "Logout failed" });
  };
}

module.exports = USERS;
