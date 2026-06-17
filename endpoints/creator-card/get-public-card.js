const { appLogger } = require('@app-core/logger');
const { createHandler } = require('@app-core/server');
const getPublicCard = require('@app/services/creator-card/get-public-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info({ requestContext: rc, response: rs }, 'get-public-card-request-completed');
  },
  async handler(rc, helpers) {
    const { accessCode } = rc.query;
    const { slug } = rc.params;
    const response = await getPublicCard({ slug, accessCode });
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card Retrieved Successfully.',
      data: response,
    };
  },
});
