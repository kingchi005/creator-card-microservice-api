/* 

   "id": "01JG8XYZA2B3C4D5E6F7G8H9J0",
    "title": "George Cooks",
    "description": "George Cooks is a weekly cooking podcast by Chef George AmadiObi",
    "slug": "george-cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "links": [
      {"title": "YouTube Channel", "url": "https://youtube.com/@georgecooks"}
    ],
    "service_rates": {
      "currency": "NGN",
      "rates": [
        {"name": "IG Story Post", "description": "One Instagram story mention", "amount": 5000000}
      ]
    },
    "status": "published",
    "access_type": "public",
    "created": 1767052800000,
    "updated": 1767052800000,
    "deleted": null
*/

/**
 * Transforms a raw Mongoose document into a clean data transfer object (DTO)
 * @param {Object} document - The raw Mongoose document instance
 * @returns {Object} Clean, serialized object
 */
function serializeCreatorCard(document) {
  const rawObj = document.toObject ? document.toObject() : { ...document };

  return {
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
    access_code: rawObj.access_code,
    created: rawObj.created,
    updated: rawObj.updated,
    deleted: rawObj.deleted,
  };
}

module.exports = serializeCreatorCard;
