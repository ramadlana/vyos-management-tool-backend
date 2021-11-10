const express = require("express");
const router = express.Router();
const CryptoJS = require("crypto-js");
const { conf } = require("../conf");
const _ = require("lodash");

// call vyos function
const {
  configureVyosHub,
  configureVyosSpoke,
  saveConfigInit,
  loadConfigInit,
  getInterface,
} = require("../networkmodule/callvyos");

// setup block tunnel claim Model
const {
  BlockTunnelModel,
  validateSetupUnderlay,
} = require("../models/blocktunnel");

// Route List model
const { RouterListModel, validateInventory } = require("../models/routerlist");

const Netmask = require("netmask").Netmask;
const { BridgeDomainMemberModel } = require("../models/bridgedomainmember");

// Setup underlay
router.post("/setupunderlay", async (req, res) => {
  // check if underlay model empty or not
  const checkAlreadySetup = await BlockTunnelModel.countDocuments();
  if (checkAlreadySetup !== 0)
    return res
      .status(400)
      .send({ success: false, message: "you already setup underlay" });

  const ipAddressUnderlay = req.body.ipAddressUnderlay;
  const validate = validateSetupUnderlay(req.body);
  if (validate.error)
    return res
      .status(400)
      .send({ success: false, message: validate.error.details[0].message });
  const blockTunnel = new Netmask(ipAddressUnderlay);
  blockTunnel.forEach(async function (ip) {
    const newIpTunnel = new BlockTunnelModel({
      ipBlockTunnel: `${ip}/${blockTunnel.bitmask}`,
      isClaimed: false,
      claimedBy: "",
    });
    await newIpTunnel.save();
  });
  return res.status(200).send({
    success: true,
    message: "underlay block created successfully",
  });
});

// Router List (GET)
router.get("/router", async (req, res) => {
  const allRouter = await RouterListModel.find().select(
    "_id management tunnel routerName interfaceList"
  ); //Exclude _id and __v from json reply
  return res.status(200).send({ success: true, message: allRouter });
});

// Add New Router List (POST)
router.post("/", async (req, res) => {
  let validate = validateInventory(req.body);

  if (validate.error)
    return res.status(400).send({
      success: false,
      message: validate.error.details[0].message,
    });

  // encrypt user password router
  /**
   * Use this to decrypt
   * let bytes = CryptoJS.AES.decrypt(routerPassword, conf.get("cryptoSecret"));
   * let decryptedText = bytes.toString(CryptoJS.enc.Utf8);
   */
  let routerPasswordEncrypted = CryptoJS.AES.encrypt(
    req.body.routerPassword,
    conf.get("cryptoSecret")
  ).toString();
  let routerKeyApiEncrypted = CryptoJS.AES.encrypt(
    req.body.keyApi,
    conf.get("cryptoSecret")
  ).toString();
  let routerNhrpSecretEncrypted = CryptoJS.AES.encrypt(
    req.body.nhrpSecret,
    conf.get("cryptoSecret")
  ).toString();

  let ipManagementWithoutMask = req.body.management;
  ipManagementWithoutMask = ipManagementWithoutMask.substr(
    0,
    ipManagementWithoutMask.lastIndexOf("/")
  );

  try {
    // Get one not claimed yet IP , and Claim it
    const getTunnelIp = await BlockTunnelModel.findOne({ isClaimed: false });

    // get ethernet List from api
    const { data: dataInterface } = await getInterface(
      ipManagementWithoutMask,
      req.body.keyApi
    );

    // Associate newIpaddress ro router attributes
    const newRouterInput = new RouterListModel({
      management: req.body.management,
      tunnel: getTunnelIp.ipBlockTunnel,
      routerName: req.body.routerName,
      alreadyManaged: true,
      routerUsername: req.body.routerUsername,
      routerPassword: routerPasswordEncrypted,
      role: req.body.role,
      keyApi: routerKeyApiEncrypted,
      nhrpSecret: routerNhrpSecretEncrypted,
      interfaceList: _.pull(_.keys(dataInterface.ethernet), "eth0"),
      bgp: {
        localAs: req.body.bgp.localAs,
        remoteAs: req.body.bgp.remoteAs,
      },
    });

    let resultConfig;
    const getTunnelBlockSubnet = getTunnelIp.ipBlockTunnel;
    const getMask = new Netmask(getTunnelBlockSubnet);
    const tunnelBlockSubnet = `${getMask.base}/${getMask.bitmask}`;

    const dataRouterInput = await newRouterInput.save();

    if (dataRouterInput.status === "error")
      return res.status(400).send({ success: false, message: dataRouterInput });
    if (req.body.role === "hub") {
      let pushConfigInit = await configureVyosHub(
        "set",
        ipManagementWithoutMask,
        newRouterInput.tunnel,
        req.body.keyApi,
        req.body.nhrpSecret,
        newRouterInput.bgp.localAs,
        tunnelBlockSubnet,
        newRouterInput.bgp.remoteAs
      );
      resultConfig = pushConfigInit;
      // if save to db success but, something wrong in call vyos, its rollback to delete in database entry
      if (!resultConfig.success) {
        await RouterListModel.findByIdAndDelete(dataRouterInput._id);
      }
    } else if (req.body.role == "spoke") {
      const hubAddress = await RouterListModel.findOne({ role: "hub" });
      let pushConfigInit = await configureVyosSpoke(
        "set",
        ipManagementWithoutMask,
        newRouterInput.tunnel,
        req.body.keyApi,
        req.body.nhrpSecret,
        hubAddress.tunnel,
        hubAddress.management,
        newRouterInput.bgp.localAs,
        newRouterInput.bgp.remoteAs
      );
      resultConfig = pushConfigInit;

      // if save to db success but, something wrong in call vyos, its rollback to delete in database entry
      if (!resultConfig.success) {
        await RouterListModel.findByIdAndDelete(dataRouterInput._id);
      }
    }

    if (resultConfig.success) {
      // claim IP address after assign
      await BlockTunnelModel.findByIdAndUpdate(getTunnelIp._id, {
        isClaimed: true,
        claimedBy: dataRouterInput._id,
      });
      return res.status(201).send({
        success: true,
        message: "Node Successfully Added",
        detail: resultConfig,
      });
    } else {
      return res.status(400).send({
        success: false,
        message: resultConfig.error || "unknown error",
        detail: resultConfig.code,
      });
    }
  } catch (error) {
    let errMsg;
    if (error.code === 11000) {
      errMsg = "Node Already Added";
    }
    res.status(400).send({ success: false, message: errMsg, detail: error });
  }
});

router.post("/load-init", async (req, res) => {
  // getIpAddress and key From RouteList Model
  const router = await RouterListModel.findById(req.body.id);
  if (!router)
    return res.status(400).send({ success: false, message: "id not found" });
  // get Ip address management
  let routerIp = router.management;
  // Strip and get first before / sign
  routerIp = routerIp.substr(0, routerIp.lastIndexOf("/"));

  // get encrypted Api key
  const apiKeyEncrypted = router.keyApi;
  let apiKeyEncryptedAsBytes = CryptoJS.AES.decrypt(
    apiKeyEncrypted,
    conf.get("cryptoSecret")
  );
  let apiKeyDecrypted = apiKeyEncryptedAsBytes.toString(CryptoJS.enc.Utf8);

  // call load init
  const result = await loadConfigInit(routerIp, apiKeyDecrypted);
  // if success reset router, delete database
  if (result.success) {
    // release claim IP address on tunnel block address
    await BlockTunnelModel.findOneAndUpdate(
      { claimedBy: req.body.id },
      { isClaimed: false, claimedBy: "" }
    );
    // Delete router from DB
    await RouterListModel.findByIdAndDelete(req.body.id);
    await BridgeDomainMemberModel.findOneAndDelete({
      idRouterListModel: req.body.id,
    });
    return res
      .status(200)
      .send({ success: true, message: `Node Successfully deleted` });
  }
  return res.status(400).send({ success: false, message: result });
});

router.post("/save-init", async (req, res) => {
  // getIpAddress and key From RouteList Model
  const router = await RouterListModel.findById(req.body.id);
  // get Ip address management
  let routerIp = router.management;
  // Strip and get first before / sign
  routerIp = routerIp.substr(0, routerIp.lastIndexOf("/"));

  // get encrypted Api key
  const apiKeyEncrypted = router.keyApi;
  let apiKeyEncryptedAsBytes = CryptoJS.AES.decrypt(
    apiKeyEncrypted,
    conf.get("cryptoSecret")
  );
  let apiKeyDecrypted = apiKeyEncryptedAsBytes.toString(CryptoJS.enc.Utf8);

  // call save config
  const result = await saveConfigInit(routerIp, apiKeyDecrypted);
  // if success reset router, delete database
  if (result.success) {
    return res.status(200).send({ success: true, result });
  }
  return res.status(400).send({ success: false, message: result });
});
// Export router function
exports.routerList = router;
