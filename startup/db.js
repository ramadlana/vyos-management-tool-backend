const mongoose = require("mongoose");
const { conf } = require("../conf");
// MONGOOSE CONNECT
const databaseName = conf.get("mongoDatabase"); // database Name
const username = conf.get("mongoUser");
const password = conf.get("mongoPassword");
// Connect in here, and operate on another files

module.exports = function () {
  mongoose.connect(
    // Connect to mongo cluster compass
    // `mongodb+srv://${username}:${password}@cluster0.htwr9.mongodb.net/${databaseName}?authSource=admin&replicaSet=atlas-gsstiv-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true`,
    // {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    //   useCreateIndex: true,
    //   useFindAndModify: false,
    // }
    // End of - Connect to mongo cluster compass

    // Connect to mongo localhost ubuntu
    `mongodb://ramalab.com:27017/vyos?readPreference=primary&appname=MongoDB%20Compass&ssl=false`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }
    // End of -Connect to mongo localhost ubuntu
  );
};
