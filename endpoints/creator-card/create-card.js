const { appLogger } = require('@app-core/logger');
const { createHandler } = require('@app-core/server');
const createCard = require('@app/services/creator-card/create-card');

module.exports = createHandler({
  path: '/creator-cards',
  method: 'post',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info({ requestContext: rc, response: rs }, 'create-card-request-completed');
  },
  async handler(rc, helpers) {
    const serviceData = rc.body;
    const response = await createCard(serviceData);
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card Created Successfully.',
      data: response,
    };
  },
});
