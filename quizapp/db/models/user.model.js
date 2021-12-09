const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { isEmail } = require("../../utils/helpers");
const argon2 = require("argon2");
const QuizTimeConstraintModel = require("./timeConstraint.model");

const UserSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
    },
    lastName: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    type: {
      type: String,
      required: true,
      ref: "Roles",
    },
  },
  {
    timestamp: true,
  }
);

UserSchema.methods.toJSON = function () {
  const user = this;
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.tokens;
  return userObj;
};

UserSchema.methods.generateAuthToken = async function () {
  console.log("jwt secret: ", process.env.JWT_SECRET);
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  user.tokens = user.tokens.concat({ token });

  await user.save();
  return token;
};

UserSchema.statics.findByCredentials = async (email, password) => {
  if (!email || !password || !isEmail(email)) {
    throw new Error("Please provide valid email and password");
  }
  const user = await UserModel.findOne({ email: email });
  console.log("User%%%%%: ", user);
  if (!user) {
    throw new Error("Couldn't login");
  }
  console.log("User: ", user);
  const isVerified = await argon2.verify(user.password, password);
  console.log("verification result: ", isVerified);
  if (!isVerified) {
    throw new Error("Authorization failed");
  }
  return await user;
};

UserSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await argon2.hash(user.password);
  }
  next();
});

UserSchema.pre('remove', async function(next) {
  const user = this
  await ScoreModel.deleteMany({userId: user._id})
  await QuizTimeConstraintModel.deleteMany({userId: user._id})
  next()
})

const UserModel = mongoose.model("Users", UserSchema);

module.exports = UserModel;

const ScoreModel = require("./scoreboard.model");