const mongoose = require("mongoose");

const BridgeDomainMemberSchema = mongoose.Schema({
  idBridgeDomainList: { type: String, required: true },
  bdName: { type: String, required: true },
  idRouterListModel: { type: String, required: true },
  routerName: { type: String, required: true },
  interfaceMember: [{ type: String, required: true }],
});

const BridgeDomainMemberModel = mongoose.model(
  "BridgeDomainMemberModel",
  BridgeDomainMemberSchema
);
exports.BridgeDomainMemberModel = BridgeDomainMemberModel;
