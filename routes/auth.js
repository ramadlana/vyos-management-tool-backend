const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Joi = require("joi");

const { User } = require("../models/users");

router.post("/login", async (req, res) => {
  const validate = validateAuth(req.body);
  if (validate.error)
    return res
      .status(200)
      .send({ status: "failed", message: validate.error.details[0].message });
  // find user using email
  let user = await User.findOne({ email: req.body.email });
  if (!user)
    return res
      .status(401)
      .send({ status: "error", message: "wrong username or password" });
  //  if user email is valid, then validate password using brcrypt compare
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res
      .status(401)
      .send({ status: "error", message: "wrong username or password" });

  //  if user& password valid then Generate token jwt. this function from model/users.js generateAuthToken()
  const token = user.generateAuthToken();

  return res.send({ status: "success", token: token });
});

function validateAuth(request) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });
  return schema.validate(request);
}

exports.auth = router;
