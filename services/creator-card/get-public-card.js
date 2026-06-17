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
    // 1. If no card with that slug exists → HTTP 404, error code NF01
    if (!card) {
      throwAppError(CreatorCardMessages.NOT_FOUND, ERROR_CODE.NOT_FOUND);
    }

    // 2. If the card exists but its status is draft → HTTP 404, error code NF02
    if (card.status === 'draft') {
      throwAppError(CreatorCardMessages.IS_DRAFT, ERROR_CODE.IS_DRAFT);
    }

    // Check Private Card Constraints
    if (card.access_type === 'private') {
      // 3. If the card is private and no access_code query parameter was supplied → HTTP 403, error code AC03
      if (!accessCode) {
        throwAppError(
          CreatorCardMessages.ACCESS_CODE_REQUIRED_ON_RETRIEVAL,
          ERROR_CODE.ACCESS_CODE_REQUIRED_ON_RETRIEVAL
        );
      }

      // 4. If the card is private and the supplied access_code does not match → HTTP 403, error code AC04
      if (accessCode !== card.access_code) {
        throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, ERROR_CODE.INVALID_ACCESS_CODE);
      }
    }

    // 5. Otherwise → HTTP 200 with the card data
    // Safe document unpacking avoiding internal loop mutation side-effects
    const cardObj = card.toObject ? card.toObject() : { ...card };

    const id = cardObj._id.toString();
    delete cardObj._id;
    delete cardObj.access_code;

    result = { id, ...cardObj };
  } catch (error) {
    console.log(error);
    console.error(error, 'get-public-card-error');
    throw error;
    // throwAppError(CreatorCardMessages.NOT_FOUND, ERROR_CODE.NOT_FOUND);
  }

  return result;
}

module.exports = getPublicCard;
