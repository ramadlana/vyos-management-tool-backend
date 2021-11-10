const mongoose = require("mongoose");
const Joi = require("joi");

// get {description, destPort, inbInt, proto, transAdd}
const dstnatSchema = mongoose.Schema({
  ruleNumber: { type: Number, unique: true, required: true },
  description: { type: String, required: true },
  destPort: { type: Number, required: true },
  inbInt: { type: String, required: true },
  proto: { type: String, required: true },
  transAdd: { type: String, required: true },
});

const DstNatModel = mongoose.model("DstNatModel", dstnatSchema);

function validateDstNatModel(reqBody) {
  const schema = Joi.object({
    ruleNumber: Joi.number().max(999).required(),
    description: Joi.string().max(50).required(),
    destPort: Joi.number().max(999).required(),
    inbInt: Joi.string().max(50).required(),
    proto: Joi.string().max(50).required(),
    transAdd: Joi.string().max(50).required(),
  });
  return schema.validate(reqBody);
}

module.exports = {
  DstNatModel: DstNatModel,
  validateDstNatModel: validateDstNatModel,
};
