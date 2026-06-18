const { appLogger } = require('@app-core/logger');
const { createHandler } = require('@app-core/server');
const deleteCard = require('@app/services/creator-card/delete-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info({ requestContext: rc, response: rs }, 'delete-card-request-completed');
  },
  async handler(rc, helpers) {
    const { creator_reference: creatorReference } = rc.body;
    const { slug } = rc.params;
    const response = await deleteCard({ slug, creator_reference: creatorReference });
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card Deleted Successfully.',
      data: response,
    };
  },
});
