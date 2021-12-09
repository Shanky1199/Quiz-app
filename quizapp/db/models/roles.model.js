const mongoose = require("mongoose");

const RolesSchema = mongoose.Schema(
  {
    type: {
      type: String,
      trim: true,
      uppercase: true,
      required: true,
      unique: true,
    },
    permissions: [
      {
        type: String,
        trim: true,
        uppercase: true,
        required: true,
      },
    ],
  },
  {
    timestamp: true,
  }
);

const RolesModel = mongoose.model("Roles", RolesSchema);

module.exports = RolesModel;
