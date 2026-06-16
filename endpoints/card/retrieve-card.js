const { appLogger } = require('@app-core/logger');
const { createHandler } = require('@app-core/server');

module.exports = createHandler({
  path: '/creator-cards/',
  method: 'get',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info({ requestContext: rc, response: rs }, 'retrieve-card-request-completed');
  },
  async handler(rc, helpers) {
    const response = 'service:retrieveCard';
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      data: response,
    };
  },
});
