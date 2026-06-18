const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const createMockServer = require('@app-core/mock-server');
const CreatorCard = require('@app/repository/creator-card');

const server = createMockServer(['endpoints/creator-card']);

describe('Creator Card Endpoints', function () {
  this.timeout(10000);

  const makePayload = (overrides = {}) => ({
    title: faker.string.alpha({ length: 10 }),
    creator_reference: faker.string.alphanumeric({ length: 20 }),
    status: 'draft',
    ...overrides,
  });

  const makeCard = (overrides = {}) => ({
    title: faker.string.alpha({ length: 10 }),
    slug: faker.string.alpha({ length: 8 }).toLowerCase(),
    creator_reference: faker.string.alphanumeric({ length: 20 }),
    status: 'published',
    access_type: 'public',
    links: [],
    service_rates: { currency: 'NGN', rates: [] },
    ...overrides,
  });

  // ─── POST /creator-cards ───────────────────────────────────────────────────

  describe('POST /creator-cards', () => {
    it('should return 200 and create a card', async () => {
      const { statusCode, data } = await server.post('/creator-cards', {
        body: makePayload(),
      });

      expect(statusCode).to.equal(200);
      expect(data.data).to.have.property('id');
      expect(data.message).to.equal('Creator Card Created Successfully.');
    });

    it('should return 200 and auto-generate a slug when omitted', async () => {
      const { statusCode, data } = await server.post('/creator-cards', {
        body: makePayload({ title: 'My Creator Card' }),
      });

      expect(statusCode).to.equal(200);
      expect(data.data.slug.length).to.be.at.least(5);
    });

    it('should return 200 and create a private card', async () => {
      const { statusCode, data } = await server.post('/creator-cards', {
        body: makePayload({
          access_type: 'private',
          access_code: faker.string.alphanumeric({ length: 6, casing: 'upper' }),
        }),
      });

      expect(statusCode).to.equal(200);
      expect(data.data.access_type).to.equal('private');
    });

    it('should return 400 when title is missing', async () => {
      const { statusCode } = await server.post('/creator-cards', {
        body: { creator_reference: faker.string.alphanumeric({ length: 20 }), status: 'draft' },
      });

      expect(statusCode).to.equal(400);
    });

    it('should return 400 when slug is already taken', async () => {
      const slug = `taken-${faker.string.alphanumeric({ length: 6 }).toLowerCase()}`;
      await CreatorCard.create(makeCard({ slug }));

      const { statusCode, data } = await server.post('/creator-cards', {
        body: makePayload({ slug }),
      });

      expect(statusCode).to.equal(400);
      expect(data.message).to.equal('Slug is already taken');
    });

    it('should return 400 when access_type is private but access_code is missing', async () => {
      const { statusCode, data } = await server.post('/creator-cards', {
        body: makePayload({ access_type: 'private' }),
      });

      expect(statusCode).to.equal(400);
      expect(data.message).to.equal('access_code is required when access_type is private');
    });

    it('should return 400 when access_code is provided with access_type public', async () => {
      const { statusCode, data } = await server.post('/creator-cards', {
        body: makePayload({ access_type: 'public', access_code: 'ABCDEF' }),
      });

      expect(statusCode).to.equal(400);
      expect(data.message).to.equal('access_code can only be set on private cards');
    });

    it('should return 400 when access_code contains non-alphanumeric characters', async () => {
      const { statusCode, data } = await server.post('/creator-cards', {
        body: makePayload({ access_type: 'private', access_code: 'AB!@#$' }),
      });

      expect(statusCode).to.equal(400);
      expect(data.message).to.equal('access_code must be alphanumeric characters');
    });
  });

  // ─── GET /creator-cards/:slug ──────────────────────────────────────────────

  describe('GET /creator-cards/:slug', () => {
    it('should return 200 and retrieve a published public card', async () => {
      const card = makeCard();
      await CreatorCard.create(card);

      const { statusCode, data } = await server.get(`/creator-cards/${card.slug}`);

      expect(statusCode).to.equal(200);
      expect(data.data.slug).to.equal(card.slug);
    });

    it('should return 200 and retrieve a private card with correct access_code', async () => {
      const accessCode = faker.string.alphanumeric({ length: 6, casing: 'upper' });
      const card = makeCard({ access_type: 'private', access_code: accessCode });
      await CreatorCard.create(card);

      const { statusCode, data } = await server.get(`/creator-cards/${card.slug}`, {
        query: { access_code: accessCode },
      });

      expect(statusCode).to.equal(200);
      expect(data.data.slug).to.equal(card.slug);
    });

    it('should return 404 when card does not exist', async () => {
      const { statusCode, data } = await server.get('/creator-cards/nonexistentslug');

      expect(statusCode).to.equal(404);
      expect(data.message).to.equal('Creator card not found');
    });

    it('should return 404 when card is in draft status', async () => {
      const card = makeCard({ status: 'draft' });
      await CreatorCard.create(card);

      const { statusCode, data } = await server.get(`/creator-cards/${card.slug}`);

      expect(statusCode).to.equal(404);
      expect(data.message).to.equal('Creator card not found');
    });

    it('should return 403 when private card is accessed without access_code', async () => {
      const card = makeCard({
        access_type: 'private',
        access_code: faker.string.alphanumeric({ length: 6, casing: 'upper' }),
      });
      await CreatorCard.create(card);

      const { statusCode, data } = await server.get(`/creator-cards/${card.slug}`);

      expect(statusCode).to.equal(403);
      expect(data.message).to.equal('This card is private. An access code is required');
    });

    it('should return 403 when an incorrect access_code is provided', async () => {
      const card = makeCard({ access_type: 'private', access_code: 'ABCDEF' });
      await CreatorCard.create(card);

      const { statusCode, data } = await server.get(`/creator-cards/${card.slug}`, {
        query: { access_code: 'XXXXXX' },
      });

      expect(statusCode).to.equal(403);
      expect(data.message).to.equal('Invalid access code');
    });
  });

  // ─── DELETE /creator-cards/:slug ──────────────────────────────────────────

  describe('DELETE /creator-cards/:slug', () => {
    it('should return 200 and soft-delete a card', async () => {
      const card = makeCard();
      await CreatorCard.create(card);

      const { statusCode, data } = await server.delete(`/creator-cards/${card.slug}`, {
        body: { creator_reference: card.creator_reference },
      });

      expect(statusCode).to.equal(200);
      expect(data.data.slug).to.equal(card.slug);
      expect(data.message).to.equal('Creator Card Deleted Successfully.');
    });

    it('should return 404 when card does not exist', async () => {
      const { statusCode, data } = await server.delete(
        `/creator-cards/${faker.string.alpha({ length: 8 }).toLowerCase()}`,
        { body: { creator_reference: faker.string.alphanumeric({ length: 20 }) } }
      );

      expect(statusCode).to.equal(404);
      expect(data.message).to.equal('Creator card not found');
    });

    it('should return 404 when creator_reference does not match', async () => {
      const card = makeCard();
      await CreatorCard.create(card);

      const { statusCode, data } = await server.delete(`/creator-cards/${card.slug}`, {
        body: { creator_reference: faker.string.alphanumeric({ length: 20 }) },
      });

      expect(statusCode).to.equal(404);
      expect(data.message).to.equal('Creator card not found');
    });

    it('should return 404 when trying to delete an already-deleted card', async () => {
      const card = makeCard();
      await CreatorCard.create(card);
      await server.delete(`/creator-cards/${card.slug}`, {
        body: { creator_reference: card.creator_reference },
      });

      const { statusCode, data } = await server.delete(`/creator-cards/${card.slug}`, {
        body: { creator_reference: card.creator_reference },
      });

      expect(statusCode).to.equal(404);
      expect(data.message).to.equal('Creator card not found');
    });
  });
});
