// set interfaces ethernet eth1 address 192.168.1.1/24

/**
 * eth1
 * 192.168.1.1/24
 * idnode
 *
 */

const mongoose = require("mongoose");
const Joi = require("joi");

const ibgpSchema = mongoose.Schema({
  interface: {
    type: String,
    required: true,
    max: 10,
  },
  ipAddress: {
    type: String,
    required: true,
    unique: true,
    max: 10,
  },
  idRouter: {
    type: String,
    required: true,
    max: 50,
  },
  routerName: {
    type: String,
    required: true,
    max: 50,
  },
});

const ibgpModel = mongoose.model("IbgpModel", ibgpSchema);

// Validation Joi
function validate(reqBody) {
  const schema = Joi.object({
    interface: Joi.string().max(50).required(),
    ipAddress: Joi.string().max(50).required(),
    idRouter: Joi.string().max(50).required(),
  });

  return schema.validate(reqBody);
}

exports.validateIbgp = validate;
exports.IbgpModel = ibgpModel;
