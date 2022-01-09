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
const { BridgeDomainListModel } = require("../models/bridgedomainlist");

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

// reset underlay
router.post("/resetunderlay", async (req, res) => {
  // check routerlistmodels db have record or not
  const rtr_obj = await RouterListModel.estimatedDocumentCount();

  // if data exist. return "please reset all node first"
  if (rtr_obj !== 0)
    return res.status(400).send({
      success: false,
      message:
        "there some router or node is using underlay, please reset all nodes before reset underlay",
    });

  // if data not exist. delete blocktunnelmodels all record
  await BlockTunnelModel.deleteMany();
  await BridgeDomainListModel.deleteMany();
  await BridgeDomainMemberModel.deleteMany();

  return res
    .status(200)
    .send({ success: true, message: "Underlay reset successfully" });
});

// Check underlay already build or not
router.get("/check-underlay", async (req, res) => {
  const checkAlreadySetup = await BlockTunnelModel.countDocuments();
  if (checkAlreadySetup !== 0)
    return res
      .status(400)
      .send({ success: false, message: "You already setup underlay" });
  return res
    .status(200)
    .send({ success: true, message: "Underlay not setup yet" });
});

// underlay info
router.get("/info-underlay", async (req, res) => {
  const count_used = await BlockTunnelModel.count({ isClaimed: true });
  const count_avail = await BlockTunnelModel.count({ isClaimed: false });
  return res.status(200).send({
    success: true,
    message: { underlay_used: count_used, underlay_available: count_avail },
  });
});

// Router List (GET)
router.get("/router", async (req, res) => {
  const allRouter = await RouterListModel.find().select(
    "_id management tunnel routerName interfaceList bgp role "
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

  // Encrypt
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
    if (!getTunnelIp)
      return res.status(400).send({
        success: false,
        message:
          "Underlay is not ready or not setup yet. Please setup underlay firts",
      });

    // get ethernet List from api
    const dataInterface = await getInterface(
      ipManagementWithoutMask,
      req.body.keyApi
    );
    if (!dataInterface.success)
      return res
        .status(400)
        .send({ success: false, message: "wrong router vyos API KEY" });
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
      interfaceList: _.pull(_.keys(dataInterface.data.ethernet), "eth0"),
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
      if (!hubAddress) {
        await RouterListModel.findByIdAndDelete(dataRouterInput._id);
        return res.status(400).send({
          success: false,
          message: "please add hub first and then spoke",
        });
      }
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
    console.log(error);
    if (error.code === 11000) {
      return res
        .status(400)
        .send({ success: false, message: "node already added" });
    } else
      res.status(400).send({
        success: false,
        message: "unhandled error #33444",
        detail: error,
      });
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
