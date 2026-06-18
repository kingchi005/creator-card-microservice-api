const validator = require('@app-core/validator');
const CreatorCard = require('@app/repository/creator-card');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { CreatorCardMessages } = require('@app/messages');
const { appLogger } = require('@app-core/logger');
const serializeCreatorCard = require('./serialize-card-data');
const generateSlug = require('./generate-slug');

const createCardSpec = `root {
	title string<minLength:3|maxLength:100>
  description? string<maxLength:500>
  slug? string<minLength:5|maxLength:50>
  creator_reference string<length:20>
  links[]? { // Links the creator wants to showcase
    title string<trim|minLength:1|maxLength:100>
    url string<trim|maxLength:200|startsWith:http://|startsWith:https://>
  }
  service_rates? { // Rates offered by the creator for services
    currency string(NGN|USD|GBP|GHS)
    rates[] { // Individual service rates
      name string<trim|minLength:3|maxLength:100>
      description string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}`;

const parsedCreateCardSpec = validator.parse(createCardSpec);

async function createCard(serviceData) {
  /**
   * @type {import('@app/models/creator-card').ModelSchema} serviceData
   */
  const validData = validator.validate(serviceData, parsedCreateCardSpec);
  let result;
  try {
    if (validData.slug) {
      const existingCard = await CreatorCard.findOne({ query: { slug: validData.slug } });
      if (existingCard) {
        throwAppError(CreatorCardMessages.SLUG_TAKEN, ERROR_CODE.SLUG_TAKEN);
      }
    } else {
      // auto-generate one from the title if omitted
      validData.slug = await generateSlug(validData.title);
    }
    if (!validData.access_type) {
      validData.access_type = 'public';
      validData.access_code = null;
    } else if (validData.access_type === 'private' && !validData.access_code) {
      throwAppError(
        CreatorCardMessages.ACCESS_CODE_REQUIRED_ON_TYPE_PRIVATE,
        ERROR_CODE.ACCESS_CODE_REQUIRED_ON_TYPE_PRIVATE
      );
    } else if (validData.access_type === 'public' && validData.access_code) {
      throwAppError(
        CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED_ON_TYPE_PUBLIC,
        ERROR_CODE.ACCESS_CODE_NOT_ALLOWED_ON_TYPE_PUBLIC
      );
    }
    appLogger.info({ validData }, 'create-card-valid-data');

    const card = await CreatorCard.create(validData);
    result = serializeCreatorCard(card, false);
  } catch (error) {
    appLogger.error(error, 'create-card-error');
    throw error;
  }
  return result;
}

module.exports = createCard;
