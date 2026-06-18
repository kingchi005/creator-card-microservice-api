const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const CreatorCard = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');
const serializeCreatorCard = require('./serialize-card-data');

const getPublicCardSpec = `root {
  slug string<trim|lowercase|minLength:5|maxLength:50>
  access_code? string<trim|length:6>
}`;

const parsedGetPublicCardSpec = validator.parse(getPublicCardSpec);

async function getPublicCard(serviceData, options = {}) {
  const { slug, access_code: accessCode } = validator.validate(
    serviceData,
    parsedGetPublicCardSpec
  );
  let result;

  try {
    const card = await CreatorCard.findOne({ query: { slug, deleted: { $eq: null } } });
    if (!card) {
      throwAppError(CreatorCardMessages.NOT_FOUND, ERROR_CODE.NOT_FOUND);
    }

    if (card.status === 'draft') {
      throwAppError(CreatorCardMessages.IS_DRAFT, ERROR_CODE.IS_DRAFT);
    }

    if (card.access_type === 'private') {
      if (!accessCode) {
        throwAppError(
          CreatorCardMessages.ACCESS_CODE_REQUIRED_ON_RETRIEVAL,
          ERROR_CODE.ACCESS_CODE_REQUIRED_ON_RETRIEVAL
        );
      }

      if (accessCode !== card.access_code) {
        throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, ERROR_CODE.INVALID_ACCESS_CODE);
      }
    }

    result = serializeCreatorCard(card);
  } catch (error) {
    appLogger.error(error, 'get-public-card-error');
    throw error;
  }

  return result;
}

module.exports = getPublicCard;
