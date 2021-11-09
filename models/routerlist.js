const mongoose = require("mongoose");
const Joi = require("joi");

// MONGOOSE SCHEMA ROUTERa
const routerListSchema = mongoose.Schema({
  routerName: {
    type: String,
    required: true,
    max: 50,
  },
  management: {
    type: String,
    unique: true,
    required: true,
    max: 100,
  },
  tunnel: {
    type: String,
    unique: true,
    required: true,
    max: 100,
  },
  bgp: mongoose.Schema({
    localAs: {
      type: String,
    },
    remoteAs: { type: String },
  }),
  ospfEnabledBlock: {
    type: Array,
    max: 100000,
  },
  alreadyManaged: {
    type: Boolean,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  keyApi: {
    type: String,
    required: true,
  },
  nhrpSecret: {
    type: String,
    required: true,
  },
  routerUsername: { type: String, required: true },
  routerPassword: { type: String, required: true },
  interfaceList: [{ type: String }],
});

const RouterListModel = mongoose.model("RouterListModel", routerListSchema);

// Function Validation JOI  This will return validation
function validate(reqBody) {
  const schema = Joi.object({
    routerName: Joi.string().max(50).required(),
    management: Joi.string()
      .ip({ version: ["ipv4", "ipv6"], cidr: "required" })
      .required(),
    bgp: Joi.object({
      localAs: Joi.number().required(),
      remoteAs: Joi.number().required(),
    }).required(),
    routerUsername: Joi.string().required(),
    role: Joi.string().required(),
    keyApi: Joi.string().required(),
    nhrpSecret: Joi.string().required(),
    routerPassword: Joi.string().required(),
  });

  return schema.validate(reqBody);
}

exports.validateInventory = validate;
exports.RouterListModel = RouterListModel;
