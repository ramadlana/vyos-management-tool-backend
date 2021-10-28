// import package
const express = require("express");
const router = express.Router();
const Joi = require("joi");
const _ = require("lodash");
var mongoose = require("mongoose");

// Import local module and model
const { RouterListModel } = require("../models/routerlist");
const { BridgeDomainListModel } = require("../models/bridgedomainlist");
const { BridgeDomainMemberModel } = require("../models/bridgedomainmember");
const { string, number } = require("joi");

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
      message: "id not found",
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
    return res
      .status(400)
      .send({
        success: false,
        message: "failed to save to database",
        details: error.message,
      });
  }
});

// Assoc nodes to bridge domain
router.post("/add-bridge-domain-member", async (req, res) => {
  const { idRouterListModel, idBridgeDomainList, interfaceMember } = req.body;
  // Get id BridgeDomainList and RouterListModel
  const bridgeDomainListObj = await BridgeDomainListModel.findById(
    idBridgeDomainList
  );
  // if bridge domain list obj not found
  if (!bridgeDomainListObj)
    return res
      .status(404)
      .send({ success: false, message: "bridge domain id not found" });
  const routerListObj = await RouterListModel.findById(idRouterListModel);

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
    interfaceMember: interfaceMember,
  });

  const save = await newMemberBd.save();

  return res.status(200).send({ success: true, message: save });
});

exports.configure = router;
