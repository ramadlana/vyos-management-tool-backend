const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");

const { User, validateUserRegister } = require("../models/users");

// Register New User
router.post("/", async (req, res) => {
  let validateForm = validateUserRegister(req.body);
  if (validateForm.error)
    return res.status(400).send({
      status: "failed",
      message: validateForm.error.details[0].message,
    });
  // using lodash for simplicity to grab attribute and value from object req.body
  const newUser = new User(_.pick(req.body, ["username", "email", "password"]));
  //   Generate gen salt default is 10
  const salt = await bcrypt.genSalt(10);
  //   hash passowrd
  newUser.password = await bcrypt.hash(newUser.password, salt);
  try {
    const saveToDb = await newUser.save();
    return res.send(_.pick(saveToDb, ["_id", "username", "email"]));
  } catch (error) {
    return res.status(400).send({
      status: "failed",
      message: error.message,
    });
  }
});

exports.user = router;
