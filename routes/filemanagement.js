const express = require("express");
const router = express.Router();
var Minio = require("minio");
const { conf } = require("../conf");

/**
 * sudo MINIO_ROOT_USER=admin MINIO_ROOT_PASSWORD=adminadminadmin minio server /mnt/data
 * /mnt/data should in WRX mode for all user
 * mc alias set myminio http://minio.mshome.net:9000 admin adminadminadmin
 * ./mc ls myminio/testing/
 */
var minioClient = new Minio.Client({
  endPoint: conf.get("minioEp"),
  port: conf.get("minioPort"),
  useSSL: conf.get("minioUseSSL"),
  accessKey: conf.get("minioAccessKey"),
  secretKey: conf.get("minioSecretKey"),
});

// Temporary Var
let bucketName = "testing";

// Upload Files
router.post("/upload", async (req, res) => {
  const userEmail = req.user.email;
  const fileContent = Buffer.from(req.files.file.data, "binary");
  const fileContent2 = Buffer.from(req.files.file2.data, "binary");
  const fileName = req.files.file.name;
  const fileName2 = req.files.file2.name;

  // const uploaderName = req.body.uploaderName;
  // const uploadDate = req.body.uploadDate;

  const finalFileName = userEmail + "_" + fileName;
  const finalFileName2 = userEmail + "_" + fileName2;
  const result = await minioClient.putObject(
    `${bucketName}`,
    finalFileName,
    fileContent
  );
  const result2 = await minioClient.putObject(
    `${bucketName}`,
    finalFileName2,
    fileContent2
  );
  res.send({
    status: "ok",
    fileName: finalFileName,
    fileName2: finalFileName2,
    fileId: result,
  });
});

router.get("/upload/", async (req, res) => {
  const filename = req.body.filename;

  // bucketname, objectname, timeInSecond
  const result = await minioClient.presignedGetObject(
    `${bucketName}`,
    filename,
    60 * 60 * 24
  );
  res.send(result);
});

exports.filemanagement = router;
