const mongoose = require("mongoose");
const Joi = require("joi");
// MONGOOSE SCHEMA VXLAN
const BridgeDomainListSchema = mongoose.Schema({
  bdName: { type: String, required: true, unique: true },
  vniId: { type: String, required: true, unique: true },
});

const BridgeDomainListModel = mongoose.model(
  "BridgeDomainListModel",
  BridgeDomainListSchema
);

exports.BridgeDomainListModel = BridgeDomainListModel;
