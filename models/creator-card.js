const { SchemaTypes, ModelSchema, DatabaseModel } = require('@app-core/mongoose');
const timestamps = require('./plugins/timestamps');

const modelName = 'creatorCards';

/**
 * @typedef {Object} Link
 * @property {String} title
 * @property {String} url
 */

/**
 * @typedef {Object} Rate
 * @property {String} name
 * @property {String} description
 * @property {Number} amount
 */

/**
 * @typedef {Object} ServiceRates
 * @property {String} currency
 * @property {Rate[]} rates
 */

/**
 * @typedef {Object} ModelSchema
 * @property {String} _id
 * @property {String} title
 * @property {String} description
 * @property {String} slug
 * @property {String} creator_reference
 * @property {Link[]} links
 * @property {ServiceRates} service_rates
 * @property {String} status
 * @property {String} access_type
 * @property {String} access_code
 * @property {Number} created
 * @property {Number} updated
 * @property {Number|null} deleted
 */

const schemaConfig = {
  _id: { type: SchemaTypes.ULID }, // Always use ULID for IDs
  title: { type: SchemaTypes.String },
  description: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String, unique: true, index: true },
  creator_reference: { type: SchemaTypes.String, index: true },
  links: [
    {
      title: { type: SchemaTypes.String },
      url: { type: SchemaTypes.String },
    },
  ],
  service_rates: {
    currency: { type: SchemaTypes.String },
    rates: [
      {
        name: { type: SchemaTypes.String },
        description: { type: SchemaTypes.String },
        amount: { type: SchemaTypes.Number },
      },
    ],
  },
  status: { type: SchemaTypes.String, index: true },
  access_type: { type: SchemaTypes.String },
  access_code: { type: SchemaTypes.String },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });
modelSchema.plugin(timestamps);

/** @type {ModelSchema} */
module.exports = DatabaseModel.model(modelName, modelSchema);
