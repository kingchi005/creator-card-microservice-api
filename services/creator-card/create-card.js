const validator = require('@app-core/validator');
const CreatorCard = require('@app/repository/creator-card');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { CreatorCardMessages } = require('@app/messages');
const { appLogger } = require('@app-core/logger');
const serializeCreatorCard = require('./serialize-card-data');
const generateSlug = require('./generate-slug');

const createCardSpec = `root {
  title string<trim|minLength:3|maxLength:100>
  description? string<trim|maxLength:500>
  slug? string<trim|lowercase|minLength:5|maxLength:50>
  creator_reference string<trim|length:20>
  links[]? { 
    title string<trim|minLength:1|maxLength:100>
    url string<trim|maxLength:200|startsWith:http://|startsWith:https://>
  }
  service_rates? { 
    currency string(NGN|USD|GBP|GHS)
    rates[] { 
      name string<trim|minLength:3|maxLength:100>
      description string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<trim|length:6>
}`;

const parsedCreateCardSpec = validator.parse(createCardSpec);

async function createCard(serviceData, options = {}) {
  const validData = validator.validate(serviceData, parsedCreateCardSpec);
  let result;
  try {
    if (validData.slug) {
      const existingCard = await CreatorCard.findOne({ query: { slug: validData.slug } });
      if (existingCard) {
        throwAppError(CreatorCardMessages.SLUG_TAKEN, ERROR_CODE.SLUG_TAKEN);
      }
    } else {
      validData.slug = await generateSlug(validData);
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
    if (validData.access_code) {
      const alphanumericChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      for (let i = 0; i < validData.access_code.length; i++) {
        if (!alphanumericChars.includes(validData.access_code[i])) {
          throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE_CHAR, ERROR_CODE.VALIDATIONERR);
        }
      }
    }
    if (validData.service_rates) {
      if (!validData.service_rates.rates.length) {
        throwAppError(CreatorCardMessages.SERVICE_RATES_EMPTY, ERROR_CODE.VALIDATIONERR);
      }
    } else {
      validData.service_rates = null;
    }

    const card = await CreatorCard.create(validData);
    result = serializeCreatorCard(card, { includeAccessCode: true });
  } catch (error) {
    appLogger.error(error, 'create-card-error');
    throw error;
  }
  return result;
}

module.exports = createCard;
