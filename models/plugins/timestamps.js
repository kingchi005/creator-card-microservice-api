// models/plugins/timestamps.js
const { SchemaTypes } = require('@app-core/mongoose');

function timestamps(schema) {
  schema.add({
    created: { type: SchemaTypes.Number },
    updated: { type: SchemaTypes.Number },
    deleted: { type: SchemaTypes.Number, default: null },
  });

  schema.pre('save', function (next) {
    const now = Date.now();
    if (!this.created) this.created = now;
    this.updated = now;
    next();
  });

  schema.pre('updateOne', function (next) {
    this.set({ updated: Date.now() });
    next();
  });

  schema.pre('findOneAndUpdate', function (next) {
    this.set({ updated: Date.now() });
    next();
  });
}

module.exports = timestamps;
