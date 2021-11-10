// winston
const winston = require("winston");
require("winston-mongodb");

// param requirement
const { conf } = require("../conf");
const databaseName = conf.get("mongoDatabase"); // database Name
const username = conf.get("mongoUser");
const password = conf.get("mongoPassword");

module.exports = function () {
  // Handling output to file
  winston.add(new winston.transports.File({ filename: "error.log" }));
  // handling output to DB
  // winston.add(
  //   new winston.transports.MongoDB({
  //     db: `mongodb+srv://${username}:${password}@cluster0.htwr9.mongodb.net/${databaseName}?authSource=admin&replicaSet=atlas-gsstiv-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true`,
  //     options: {
  //       useNewUrlParser: true,
  //       useUnifiedTopology: true,
  //     },
  //   })
  // );

  // Handling Uncaught
  process.on("uncaughtException", (ex) => {
    console.log(ex);
    winston.error("We Got An Uncaught Exception", ex);
  });

  // Handling Promise rejection
  process.on("unhandledRejection", (ex) => {
    winston.error("We Got An unhandledRejection Exception", ex);
    console.log(ex);
  });
};
