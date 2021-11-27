// import package
const express = require("express");
const router = express.Router();
const Joi = require("joi");
const _ = require("lodash");

// Import local module and model
const { decrypt, removeMask } = require("../local_modules/common_operations");
const { RouterListModel } = require("../models/routerlist");
const dstnat = require("../models/dstnat");
const { BridgeDomainListModel } = require("../models/bridgedomainlist");
const { BridgeDomainMemberModel } = require("../models/bridgedomainmember");
const {
  nodeToBridgeDomain,
  assocIntVxlan,
  confInter,
} = require("../networkmodule/callvyos");

router.get("/bridgedomain", async (req, res) => {
  // find all item in (BridgeDomainListModel) then populate routerName in (inventoryModel) into associatedNode.nodeId field in (BridgeDomainListModel) then select (vxlanName vniId associatedNode) field only to return
  const bridgeDomain = await BridgeDomainListModel.find();
  return res.status(200).send({ success: true, message: bridgeDomain });
});

// get pagination
router.get(
  "/bridgedomainpagination/:currentPage/:maxPerPage",
  async (req, res) => {
    const { currentPage, maxPerPage } = req.params;

    // find all item in (BridgeDomainListModel) then populate routerName in (inventoryModel) into associatedNode.nodeId field in (BridgeDomainListModel) then select (vxlanName vniId associatedNode) field only to return
    const bridgeDomain = await BridgeDomainListModel.find()
      .skip(currentPage - 1)
      .limit(parseInt(maxPerPage));

    const documentCount = await BridgeDomainListModel.countDocuments();
    return res.status(200).send({
      success: true,
      message: {
        totalPage: Math.ceil(documentCount / parseInt(maxPerPage)),
        currentPage: parseInt(currentPage),
        maxPerPage: parseInt(maxPerPage),
        data: bridgeDomain,
      },
    });
  }
);

router.get("/member-of-bd/:id", async (req, res) => {
  const idBridge = await req.params.id;
  const result = await BridgeDomainMemberModel.find({
    idBridgeDomainList: idBridge,
  }).select("idRouterListModel routerName interfaceMember bdName -_id");
  // check using lodash is empty. return true if findObj return null or empty object
  const empty = _.isEmpty(result);
  // if empty then return not found
  if (empty)
    return res.status(404).send({
      success: false,
      message: "bridge domain not found",
    });

  return res.status(200).send({ success: true, message: result });
});

router.get("/member-vxlan-of-nodes/:id", async (req, res) => {
  const idRouter = await req.params.id;
  const result = await BridgeDomainMemberModel.find({
    idRouterListModel: idRouter,
  }).select("vniId bdName interfaceMember -_id");
  // check using lodash is empty. return true if findObj return null or empty object
  const empty = _.isEmpty(result);
  // if empty then return not found
  if (empty)
    return res.status(404).send({
      success: false,
      message: "bridge domain not found",
    });

  return res.status(200).send({ success: true, message: result });
});

// Create Bridge Domain
router.post("/create-new-bridge-domain", async (req, res) => {
  // Validate req.body object with validator
  const validateForm = Joi.object({
    bdName: Joi.string().required(),
    vniId: Joi.number().min(0).max(16000000),
  });

  const isValid = validateForm.validate(req.body);

  if (isValid.error)
    return res
      .status(400)
      .send({ success: false, message: isValid.error.details[0].message });
  const { bdName, vniId } = req.body;

  //Create new bridge domain model, with associatedNode
  const newBridgeDomain = new BridgeDomainListModel({
    bdName: bdName,
    vniId: vniId,
  });
  try {
    const save = await newBridgeDomain.save();
    return res.status(200).send({ success: true, message: save });
  } catch (error) {
    return res.status(400).send({
      success: false,
      message: "failed to save to database",
      details: error.message,
    });
  }
});

router.post("/delete-bridge-domain", async (req, res) => {
  const { idBridge } = req.body;

  // check if id on BridgeDomainListModel is model exist
  try {
    const bd = await BridgeDomainListModel.findById(idBridge);
    // if id not found in bridge domain member model, so member not found and delete it immediately
    if (!bd) {
      return res
        .status(404)
        .send({ success: false, message: "id Bridge not found" });
    }
  } catch (error) {
    return res.status(400).send({
      success: false,
      message:
        "something happen when finding id bridge, please check idbride make sure is exist" ||
        error.name,
      err_code: "001",
    });
  }

  // check BridgeDomainMemberModel member is exist
  try {
    const member = await BridgeDomainMemberModel.find({
      idBridgeDomainList: idBridge,
    });
    // if not existt member is empty list that falsy
    if (_.isEmpty(member)) {
      // delete from BridgeDomainListModel directly when no member attached
      await BridgeDomainListModel.findByIdAndDelete(idBridge);
      return res.status(200).send({
        success: true,
        message:
          "member dont have any member, bridge deleted from database directly ",
      });
    }

    // if member exist call config vyos API and delete it one by one
    member.forEach(async (router) => {
      // get rtr objt
      const rtrObj = await RouterListModel.findById(router.idRouterListModel);
      const routerIp = removeMask(rtrObj.management);
      const apiKeyDecrypted = decrypt(rtrObj.keyApi);
      const vniId = router.vniId;
      const tunnelAdd = removeMask(rtrObj.tunnel);

      const vxlanConf = await nodeToBridgeDomain(
        "delete",
        routerIp,
        apiKeyDecrypted,
        vniId,
        tunnelAdd
      );

      // get back interfaces
      rtrObj.interfaceList = _.union(
        rtrObj.interfaceList,
        router.interfaceMember
      );

      await rtrObj.save();

      // delete after executed
      await BridgeDomainMemberModel.deleteMany({
        idBridgeDomainList: idBridge,
        idRouterListModel: router.idRouterListModel,
      });

      if (!vxlanConf.success)
        return res.status(404).send({
          success: false,
          message: "Remove config from router failed",
          details: vxlanConf,
        });
    });
    // delete from bridge model list
    await BridgeDomainListModel.findByIdAndDelete(idBridge);
  } catch (error) {
    return res.status(400).send({
      success: false,
      message:
        "something happen when check BridgeDomainMemberModel member is exist ",
    });
  }

  return res.status(200).send({ success: true, message: "ok" });
});
// Assoc nodes to bridge domain
router.post("/add-bridge-domain-member", async (req, res) => {
  const { idRouter, idBridgeDomain } = req.body;
  const interfaceMember = [];
  // Get id BridgeDomainList and RouterListModel
  const bridgeDomainListObj = await BridgeDomainListModel.findById(
    idBridgeDomain
  );

  // if bridge domain list obj not found
  if (!bridgeDomainListObj)
    return res
      .status(404)
      .send({ success: false, message: "bridge domain id not found" });

  const routerListObj = await RouterListModel.findById(idRouter);
  // if router list obj not found
  if (!routerListObj)
    return res.status(404).send({
      success: false,
      message: "idRouterListModel domain id not found",
    });

  // Check if Already associated (exist) in database. using find return empty object if NOT exist
  const findObj = await BridgeDomainMemberModel.find({
    idBridgeDomainList: bridgeDomainListObj._id,
    idRouterListModel: routerListObj._id,
  });
  // check using lodash is empty. return true if findObj return null or empty object
  const empty = _.isEmpty(findObj);
  // if not empty, means object already exists in DB, then return error to avoid data duplication
  if (!empty)
    return res.status(400).send({
      success: false,
      message: "Router Already Associated to Bridge Domain",
    });

  // if not found in existing then create new
  // create new object
  const newMemberBd = new BridgeDomainMemberModel({
    idBridgeDomainList: bridgeDomainListObj._id,
    idRouterListModel: routerListObj._id,
    bdName: bridgeDomainListObj.bdName,
    routerName: routerListObj.routerName,
    vniId: bridgeDomainListObj.vniId,
  });

  const save = await newMemberBd.save();

  if (save) {
    let routerIp = routerListObj.management;
    routerIp = routerIp.substr(0, routerIp.lastIndexOf("/"));

    let tunnelAdd = routerListObj.tunnel;
    tunnelAdd = tunnelAdd.substr(0, tunnelAdd.lastIndexOf("/"));

    let apiKeyDecrypted = decrypt(routerListObj.keyApi);

    const vxlanConf = await nodeToBridgeDomain(
      "set",
      routerIp,
      apiKeyDecrypted,
      bridgeDomainListObj.vniId,
      tunnelAdd
    );
    if (vxlanConf.success)
      return res.status(200).send({
        success: true,
        message: "Node Successfully Added to Bridge Domain",
      });
  } else
    return res.status(400).send({
      success: false,
      message: "failed to push",
    });
});

// Deassoc node from bridge domain
router.post("/remove-bridge-domain-member", async (req, res) => {
  // get req body
  const { idBridgeDomain, idRouter } = req.body;

  // get BRIDGE DOMAIN OBJ
  const brObj = await BridgeDomainListModel.findById(idBridgeDomain);
  if (!brObj)
    return res
      .status(404)
      .send({ success: false, message: "Bridge domain not found" });

  // get ROUTER OBJ
  const rtrObj = await RouterListModel.findById(idRouter);
  if (!rtrObj)
    return res
      .status(404)
      .send({ success: false, message: "Bridge domain not found" });

  // get property needed
  const routerIp = removeMask(rtrObj.management);
  const apiKeyDecrypted = decrypt(rtrObj.keyApi);
  const vniId = brObj.vniId;
  const tunnelAdd = removeMask(rtrObj.tunnel);

  const vxlanConf = await nodeToBridgeDomain(
    "delete",
    routerIp,
    apiKeyDecrypted,
    vniId,
    tunnelAdd
  );
  if (!vxlanConf.success)
    return res.status(404).send({
      success: false,
      message: "Remove config from router failed",
      details: vxlanConf,
    });

  // remove from BRIDGE DOMAIN MEMBER MODELS
  await BridgeDomainMemberModel.findOneAndDelete({
    idRouterListModel: idRouter,
    idBridgeDomainList: idBridgeDomain,
  });

  // Return success
  return res.status(200).send({
    success: true,
    message: "Bridge domain successfully deassociated",
  });
});

// Assoc interface to vxlan on selected nodes
router.post("/assoc-int-vxlan", async (req, res) => {
  // Need input, interface, vniid, idnodes
  const { interface, idBridge, idRouter } = req.body;

  // Get ip router obj and grab ip address
  const rtrObj = await RouterListModel.findById(idRouter);
  if (!rtrObj)
    return res.status(404).send({
      success: false,
      message: "id router not found",
    });

  // get bridge object
  const bridgeObj = await BridgeDomainListModel.findById(idBridge);
  if (!bridgeObj)
    return res.status(404).send({
      success: false,
      message: "id bridge not found",
    });

  // init const
  const ipManagement = removeMask(rtrObj.management);
  const decryptKey = decrypt(rtrObj.keyApi);
  const vniId = bridgeObj.vniId;

  // check if interface not includes in interfaceslist on router obj
  const exist = _.includes(rtrObj.interfaceList, interface);

  if (!exist)
    return res.status(400).send({
      success: false,
      message: "that interface already on another bridge domain",
    });
  // if exist remove from list
  if (exist) _.pull(rtrObj.interfaceList, interface);

  // save updated rtrObj
  await RouterListModel.findByIdAndUpdate(idRouter, {
    interfaceList: rtrObj.interfaceList,
  });

  // Save member of bd model
  const bdmodelObj = await BridgeDomainMemberModel.findOne({
    idRouterListModel: idRouter,
  });

  const newInterfaceList = _.union(bdmodelObj.interfaceMember, [interface]);

  await BridgeDomainMemberModel.findOneAndUpdate(
    { idRouterListModel: idRouter },
    {
      interfaceMember: newInterfaceList,
    }
  );

  // call assoc int vxlan vyos function using try catch block
  const push = await assocIntVxlan(
    "set",
    ipManagement,
    decryptKey,
    vniId,
    interface
  );
  if (push.success)
    return res
      .status(200)
      .send({ success: true, message: "interfaces successfully associated" });
  return res
    .status(400)
    .send({ success: false, message: "interfaces failed associated" });
});

// Deassociate interface from bridge domain
router.post("/deassoc-int-vxlan", async (req, res) => {
  // Need input, interface, vniid, idnodes
  const { interface, idBridge, idRouter } = req.body;

  // Get ip router obj and grab ip address
  const rtrObj = await RouterListModel.findById(idRouter);
  if (!rtrObj)
    return res.status(404).send({
      success: false,
      message: "id router not found",
    });

  // get bridge object
  const bridgeObj = await BridgeDomainListModel.findById(idBridge);
  if (!bridgeObj)
    return res.status(404).send({
      success: false,
      message: "id bridge not found",
    });

  // get BridgeDomainMemberModel obj
  const brMemObj = await BridgeDomainMemberModel.findOne({
    idRouterListModel: idRouter,
  });

  // Remove {interface} from brMemObj.interfaceMember and move it to rtrObj.interfaceList
  _.pull(brMemObj.interfaceMember, interface);
  const newinterfacelist = _.union(rtrObj.interfaceList, [interface]);

  // then save it to each
  await BridgeDomainMemberModel.findOneAndUpdate(
    { idRouterListModel: idRouter },
    { interfaceMember: brMemObj.interfaceMember }
  );
  await RouterListModel.findByIdAndUpdate(idRouter, {
    interfaceList: newinterfacelist,
  });

  // init const
  const ipManagement = removeMask(rtrObj.management);
  const decryptKey = decrypt(rtrObj.keyApi);
  const vniId = bridgeObj.vniId;

  const push = await assocIntVxlan(
    "delete",
    ipManagement,
    decryptKey,
    vniId,
    interface
  );

  if (push.success)
    return res
      .status(200)
      .send({ success: true, message: "interfaces successfully Deassociated" });
  return res
    .status(400)
    .send({ success: false, message: "interfaces failed Deassociated" });
});

// list current dstnat
router.get("/dstnat", async (req, res) => {
  // get list of rules and return it
});

// add new dstnat
router.post("/dstnat", async (req, res) => {
  // get request body
  const { ruleNumber, description, destPort, inbInt, proto, transAdd } =
    req.body;
  // get list of rules get("/dstnat")
  // check if rule number is already exist
  // create new instance model dstnat
  const newDst = new dstnat.DstNatModel({
    ruleNumber,
    description,
    destPort,
    inbInt,
    proto,
    transAdd,
  });
  await newDst.save();
  return res
    .status(200)
    .send({ success: true, message: "DSTNAT successfully added" });
  // get {ruleNumber, description, destPort, inbInt, proto, transAdd}
  // call function on callvyos
});

router.post("/ibgp-add-address", async (req, res) => {
  // get req body
  const { idRouter, interface, ipAddress } = req.body;
  // get router obj info
  const rtr_obj = await RouterListModel.findById(idRouter);
  if (!rtr_obj)
    return res
      .status(404)
      .send({ success: false, message: "id router not found" });
  // get var
  managementIP = removeMask(rtr_obj.management);
  keyApi = decrypt(rtr_obj.keyApi);
  // call vyos conf
  try {
    const conf = await confInter(
      "set",
      managementIP,
      keyApi,
      interface,
      ipAddress
    );
    if (!conf.success)
      return res.status(400).send({
        success: false,
        message: "cannot push to device or router",
        detail: conf,
      });

    // return success
    return res.status(200).send({
      success: true,
      message: "successfully added to iBGP routing table",
    });
  } catch (error) {
    return res.status(400).send({ success: false, message: error });
  }
});

router.post("/ibgp-remove-address", async (req, res) => {
  // get req body
  const { idRouter, interface, ipAddress } = req.body;
  // get router obj info
  const rtr_obj = await RouterListModel.findById(idRouter);
  if (!rtr_obj)
    return res
      .status(404)
      .send({ success: false, message: "id router not found" });
  // get var
  managementIP = removeMask(rtr_obj.management);
  keyApi = decrypt(rtr_obj.keyApi);
  // call vyos conf
  try {
    const conf = await confInter(
      "delete",
      managementIP,
      keyApi,
      interface,
      ipAddress
    );
    if (!conf.success)
      return res.status(400).send({
        success: false,
        message: "cannot push to device or router",
        detail: conf,
      });

    // return success
    return res.status(200).send({
      success: true,
      message: "successfully deleted from iBGP routing table",
    });
  } catch (error) {
    return res.status(400).send({ success: false, message: error });
  }
});

exports.configure = router;
