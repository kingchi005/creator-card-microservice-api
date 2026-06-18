const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const CreatorCard = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');
const serializeCreatorCard = require('./serialize-card-data');

const deleteCardSpec = `root {
  slug string<trim|lowercase|minLength:5|maxLength:50>
	creator_reference string<trim|length:20>
}`;

const parsedDeleteCardSpec = validator.parse(deleteCardSpec);

async function deleteCard(serviceData) {
  const { slug, creator_reference: creatorReference } = validator.validate(
    serviceData,
    parsedDeleteCardSpec
  );
  let result;

  try {
    const card = await CreatorCard.findOne({
      query: { slug, creator_reference: creatorReference, deleted: { $eq: null } },
    });

    if (!card) {
      throwAppError(CreatorCardMessages.NOT_FOUND, ERROR_CODE.NOT_FOUND);
    }

    const updateValues = { deleted: Date.now() };

    await CreatorCard.updateOne({
      query: { slug, creator_reference: creatorReference },
      updateValues,
    });

    result = serializeCreatorCard({ ...card, ...updateValues });
  } catch (error) {
    appLogger.error(error, 'delete-card-error');
    throw error;
    // throwAppError(CreatorCardMessages.NOT_FOUND, ERROR_CODE.NOT_FOUND);
  }

  return result;
}

module.exports = deleteCard;
