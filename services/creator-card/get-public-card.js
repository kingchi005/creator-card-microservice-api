const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const CreatorCard = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');

const getPublicCardSpec = `root {
  slug string<minLength:5|maxLength:50>
  accessCode? string<length:6>
}`;

const parsedGetPublicCardSpec = validator.parse(getPublicCardSpec);

async function getPublicCard(serviceData) {
  const { slug, accessCode } = validator.validate(serviceData, parsedGetPublicCardSpec);
  let result;

  try {
    const card = await CreatorCard.findOne({ query: { slug } });
    if (!card) {
      // HTTP 404, error code NF01
      throwAppError(CreatorCardMessages.NOT_FOUND, ERROR_CODE.NOT_FOUND);
    }

    if (card.status === 'draft') {
      // HTTP 404, error code NF02
      throwAppError(CreatorCardMessages.IS_DRAFT, ERROR_CODE.IS_DRAFT);
    }

    if (card.access_type === 'private') {
      if (!accessCode) {
        //  HTTP 403, error code AC03
        throwAppError(
          CreatorCardMessages.ACCESS_CODE_REQUIRED_ON_RETRIEVAL,
          ERROR_CODE.ACCESS_CODE_REQUIRED_ON_RETRIEVAL
        );
      }

      if (accessCode !== card.access_code) {
        // HTTP 403, error code AC04
        throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, ERROR_CODE.INVALID_ACCESS_CODE);
      }
    }
    result = card;
  } catch (error) {
    appLogger.error(error, 'get-public-card-error');
  }

  return result;
}

module.exports = getPublicCard;
