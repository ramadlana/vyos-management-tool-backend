const mongoose = require("mongoose");
const Joi = require("joi");

const blockTunnelSchema = mongoose.Schema({
  ipBlockTunnel: {
    type: String,
    unique: true,
    max: 100,
  },
  isClaimed: { type: Boolean },
  claimedBy: { type: String },
});

const BlockTunnelModel = mongoose.model("BlockTunnelModel", blockTunnelSchema);

function validate(reqBody) {
  const schema = Joi.object({
    ipAddressUnderlay: Joi.string()
      .ip({ version: ["ipv4", "ipv6"], cidr: "required" })
      .required(),
  });
  return schema.validate(reqBody);
}

exports.BlockTunnelModel = BlockTunnelModel;
exports.validateSetupUnderlay = validate;
