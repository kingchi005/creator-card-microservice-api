const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const CreatorCard = require('@app/repository/creator-card');
const getPublicCard = require('@app/services/creator-card/get-public-card');

describe('getPublicCard Service', function () {
  this.timeout(10000);

  const makeCard = (overrides = {}) => ({
    title: faker.string.alpha({ length: 10 }),
    slug: faker.string.alpha({ length: 8 }).toLowerCase(),
    creator_reference: faker.string.alphanumeric({ length: 20 }),
    status: 'published',
    access_type: 'public',
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

  it('should return a private card when correct access code is provided', async () => {
    const slug = faker.string.alpha({ length: 8 }).toLowerCase();
    const accessCode = faker.string.alphanumeric({ length: 6, casing: 'upper' });
    await CreatorCard.create(makeCard({ slug, access_type: 'private', access_code: accessCode }));

    const result = await getPublicCard({ slug, accessCode });

    expect(result).to.not.equal(null);
    expect(result.slug).to.equal(slug);
  });

  it('should return undefined when card does not exist', async () => {
    const result = await getPublicCard({ slug: 'nonexistentslug' });

    expect(result).to.equal(undefined);
  });

  it('should return undefined when card is in draft status', async () => {
    const slug = faker.string.alpha({ length: 8 }).toLowerCase();
    await CreatorCard.create(makeCard({ slug, status: 'draft' }));

    const result = await getPublicCard({ slug });

    expect(result).to.equal(undefined);
  });

  it('should return undefined when private card is accessed without access code', async () => {
    const slug = faker.string.alpha({ length: 8 }).toLowerCase();
    await CreatorCard.create(
      makeCard({
        slug,
        access_type: 'private',
        access_code: faker.string.alphanumeric({ length: 6, casing: 'upper' }),
      })
    );

    const result = await getPublicCard({ slug });

    expect(result).to.equal(undefined);
  });

  it('should return undefined when an incorrect access code is provided', async () => {
    const slug = faker.string.alpha({ length: 8 }).toLowerCase();
    await CreatorCard.create(makeCard({ slug, access_type: 'private', access_code: 'ABCDEF' }));

    const result = await getPublicCard({ slug, accessCode: 'XXXXXX' });

    expect(result).to.equal(undefined);
  });

  it('should throw a validation error when slug is too short', async () => {
    let error;
    try {
      await getPublicCard({ slug: 'abc' }); // less than minLength:5
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
    expect(error).to.not.equal(null);
  });

  it('should throw a validation error when accessCode is the wrong length', async () => {
    let error;
    try {
      await getPublicCard({ slug: 'validslug', accessCode: 'ABC' }); // not length:6
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
    expect(error).to.not.equal(null);
  });
});
