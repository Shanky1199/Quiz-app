class AUTH {
  static authorizationFailed(res, msg = undefined) {
    res.status(403).send({ message: msg ? msg : "Authorization failed" });
  }
  static unauthorizedAccess(res, msg = undefined) {
    res.status(403).send({ message: msg ? msg : "Unauthorized access" });
  }
  static insufficientPermissions(res, msg = undefined) {
    res.status(403).send({ message: msg ? msg : "Insufficient permissions" });
  }
  static requestDenied(res, msg = undefined) {
    res.status(400).send({
      message: msg
        ? msg
        : "Request denied, This may happen if the user doesn't have certain access clearence or permission to undertake the action",
    });
  }
}

module.exports = AUTH;
