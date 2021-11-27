const winston = require("winston");
module.exports = function (err, req, res, next) {
  winston.log("warn", err.message, err);
  // USE: throw {message: "error test message", details: "here for detail obj"}
  console.log(err);
  res.status(500).send({
    success: false,
    status: "unHandled error",
    message: err.message,
    details: err,
  });
};
