// module to handling error
require("express-async-errors");
// initiate express js
const express = require("express");
const app = express();
// file upload middleware
const fileupload = require("express-fileupload");
// conf file
const { conf } = require("./conf");
// enable cors
var cors = require("cors");
// Use this after the variable declaration
app.use(cors());

// Enable Build-in midleware express
// Enable Json Body format
app.use(express.json());
// Enable Request As Body (JSON)
app.use(express.urlencoded({ extended: true }));
// File Upload
app.use(fileupload());

// Call Startup
require("./startup/log")();
require("./startup/db")();
require("./startup/routes")(app);

/**
 * Print process env to check environtment - add using: export NODE_PORT=5000 - console.log(process.env);
 * start daemon web service
 */
const port = conf.get("nodePort") || 3000;
app.listen(port, () => console.log(`starting web service on port ${port}`));
