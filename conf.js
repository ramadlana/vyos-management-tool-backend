const Conf = require("conf");
const config = new Conf();

// Minio
config.set("minioEp", "172.19.141.100");
config.set("minioPort", 9000);
config.set("minioUseSSL", false);
config.set("minioAccessKey", "binus");
config.set("minioSecretKey", "binusjakarta");

// MongoDB
config.set("mongoUser", "user");
config.set("mongoDatabase", "vyos");
config.set("mongoPassword", "a%24QkQE3myJ.wahE");

// JWT
config.set("jwtSecret", "rahasia");

// NODE PORT
config.set("nodePort", 8000);

// JWT SECRET
config.set("jwtSecret", "rahasia");

// CRIPTO SECRET
config.set("cryptoSecret", "rahasiajuga");

exports.conf = config;
