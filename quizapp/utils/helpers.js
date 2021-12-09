const isStrongPassword = (string) => {
  if (
    !string.match(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$&+,:;=?@#|'<>.^*()%!-])[a-zA-Z0-9$&+,:;=?@#|'<>.^*()%!-]{6,}/g
    )
  ) {
    return false;
  }
  return true;
};

const isEmail = (string) => {
  if (!string.match(/[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+/g)) {
    return false;
  }
  return true;
};

module.exports = {
  isStrongPassword,
  isEmail
};
