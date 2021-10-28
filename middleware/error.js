const winston = require("winston");
module.exports = function (err, req, res, next) {
  winston.log("warn", err.message, err);
  // USE: throw {message: "error test message", details: "here for detail obj"}
  res
    .status(500)
    .send({ status: "unHandled error", message: err.message, details: err });
};
