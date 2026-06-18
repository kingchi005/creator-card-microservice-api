function serializeCreatorCard(serviceData, options = {}) {
  const { includeAccessCode = false } = options;
  const rawObj = serviceData.toObject ? serviceData.toObject() : { ...serviceData };
  const serialized = {
    id: rawObj._id ? rawObj._id.toString() : rawObj.id,
    title: rawObj.title,
    description: rawObj.description,
    slug: rawObj.slug,
    creator_reference: rawObj.creator_reference,

    links: rawObj.links.map((link) => ({
      title: link.title,
      url: link.url,
    })),

    service_rates: rawObj.service_rates
      ? {
          currency: rawObj.service_rates.currency,
          rates: rawObj.service_rates.rates.map((rate) => ({
            name: rate.name,
            description: rate.description,
            amount: rate.amount,
          })),
        }
      : null,

    status: rawObj.status,
    access_type: rawObj.access_type,
    created: rawObj.created,
    updated: rawObj.updated,
    deleted: rawObj.deleted,
  };

  if (includeAccessCode) {
    serialized.access_code = rawObj.access_code;
  }

  return serialized;
}

module.exports = serializeCreatorCard;
