const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const { DatabaseModel, createConnection } = require('@app-core/mongoose');
const CreatorCard = require('@app/repository/creator-card');
const getPublicCard = require('@app/services/creator-card/get-public-card');

describe('getPublicCard Service', function () {
  this.timeout(10000);

  before(async () => {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) throw new Error('MONGODB_URI environment variable is not set');

    const { connection } = DatabaseModel;
    if (!connection || connection.readyState === 0) {
      await createConnection({ uri: dbUri });
    }
  });

  after(async () => {
    const { connection } = DatabaseModel;
    if (connection && connection.readyState !== 0) {
      await connection.close();
    }
    process.exit(0);
  });

  const makeCard = (overrides = {}) => ({
    title: faker.string.alpha({ length: 10 }),
    slug: faker.string.alpha({ length: 8 }).toLowerCase(),
    creator_reference: faker.string.alphanumeric({ length: 20 }),
    status: 'published',
    access_type: 'public',
    links: [],
    service_rates: { currency: 'USD', rates: [] },
    ...overrides,
  });

  it('should return a published public card by slug', async () => {
    const slug = faker.string.alpha({ length: 8 }).toLowerCase();
    await CreatorCard.create(makeCard({ slug }));

    const result = await getPublicCard({ slug });

    expect(result).to.not.equal(null);
    expect(result.slug).to.equal(slug);
  });

  it('should return a private card when correct access_code is provided', async () => {
    const slug = faker.string.alpha({ length: 8 }).toLowerCase();
    const accessCode = faker.string.alphanumeric({ length: 6, casing: 'upper' });
    await CreatorCard.create(makeCard({ slug, access_type: 'private', access_code: accessCode }));

    const result = await getPublicCard({ slug, access_code: accessCode });

    expect(result).to.not.equal(null);
    expect(result.slug).to.equal(slug);
  });

  it('should throw when card does not exist', async () => {
    let error;
    try {
      await getPublicCard({ slug: 'nonexistentslug' });
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
    expect(error.message).to.equal('Creator card not found');
  });

  it('should throw when card is in draft status', async () => {
    const slug = faker.string.alpha({ length: 8 }).toLowerCase();
    await CreatorCard.create(makeCard({ slug, status: 'draft' }));

    let error;
    try {
      await getPublicCard({ slug });
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
    expect(error.message).to.equal('Creator card not found');
  });

  it('should throw when private card is accessed without access_code', async () => {
    const slug = faker.string.alpha({ length: 8 }).toLowerCase();
    await CreatorCard.create(
      makeCard({
        slug,
        access_type: 'private',
        access_code: faker.string.alphanumeric({ length: 6, casing: 'upper' }),
      })
    );

    let error;
    try {
      await getPublicCard({ slug });
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
    expect(error.message).to.equal('This card is private. An access code is required');
  });

  it('should throw when an incorrect access_code is provided', async () => {
    const slug = faker.string.alpha({ length: 8 }).toLowerCase();
    await CreatorCard.create(makeCard({ slug, access_type: 'private', access_code: 'ABCDEF' }));

    let error;
    try {
      await getPublicCard({ slug, access_code: 'XXXXXX' });
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
    expect(error.message).to.equal('Invalid access code');
  });

  it('should throw a validation error when slug is too short', async () => {
    let error;
    try {
      await getPublicCard({ slug: 'abc' });
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
  });

  it('should throw a validation error when access_code is the wrong length', async () => {
    let error;
    try {
      await getPublicCard({ slug: 'validslug', access_code: 'ABC' });
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
  });
});
