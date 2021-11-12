/**
 * this is for common operation
 */
const CryptoJS = require("crypto-js");
const { conf } = require("../conf");

function removeMask(ipadd) {
  let ipWoMask = ipadd;
  ipWoMask = ipWoMask.substr(0, ipWoMask.lastIndexOf("/"));
  return ipWoMask;
}

function decrypt(enc) {
  let decrypted = CryptoJS.AES.decrypt(enc, conf.get("cryptoSecret"));
  return decrypted.toString(CryptoJS.enc.Utf8);
}

module.exports = {
  removeMask,
  decrypt,
};
