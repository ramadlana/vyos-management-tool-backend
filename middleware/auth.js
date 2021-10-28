const jwt = require("jsonwebtoken");
const { conf } = require("../conf");

function auth(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token)
    return res
      .status(401)
      .send({ status: "error", message: "Access Denied. No Token Provided" });

  try {
    const decoded = jwt.verify(token, conf.get("jwtSecret"));
    req.user = decoded;
    if (!req.user.isActive)
      return res
        .status(401)
        .send({ status: "error", message: "user is not active yet" });
    next();
  } catch (error) {
    res.status(400).send({ status: "error", message: error.message });
  }
}

exports.auth_midleware = auth;
