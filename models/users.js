const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { conf } = require("../conf");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    max: 255,
    require: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    max: 100,
  },
  password: {
    type: String,
    max: 300,
    require: true,
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: false,
  },
});

const User = mongoose.model("User", userSchema);

// created manual using prototype from user models
User.prototype.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      email: this.email,
      isActive: this.isActive,
      isAdmin: this.isAdmin,
    },
    conf.get("jwtSecret"),
    { expiresIn: "1000d" }
  );
  return token;
};

function validate(reqBody) {
  const schema = Joi.object({
    username: Joi.string().max(255).required(),
    email: Joi.string().max(255).email(),
    password: Joi.string().max(300).required(),
  });

  return schema.validate(reqBody);
}

exports.User = User;
exports.validateUserRegister = validate;
