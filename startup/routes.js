// Middle Ware
const { auth_midleware } = require("../middleware/auth");
const error = require("../middleware/error");
// Routes
const { user } = require("../routes/users");
const { auth } = require("../routes/auth");
const { routerList } = require("../routes/routerlist");
const { configure } = require("../routes/configure");
const { filemanagement } = require("../routes/filemanagement");

module.exports = function (app) {
  // URL Endpoint for - address:port/configure. All route here is not using authentication
  app.use("/user", user);
  app.use("/auth", auth);

  app.use(auth_midleware);
  // Bellow is all URL that use auth_midleware. all request to this address must be using header "x-auth-token" without ("")
  app.use("/inventory", routerList);
  app.use("/configure", configure);
  app.use("/files", filemanagement);

  // error handling
  app.use(error);
};
