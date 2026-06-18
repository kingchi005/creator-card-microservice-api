const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const CreatorCard = require('@app/repository/creator-card');
const deleteCard = require('@app/services/creator-card/delete-card');

describe('deleteCard Service', function () {
  this.timeout(10000);

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

  it('should soft-delete a card and return serialized data with timestamps', async () => {
    const card = makeCard();
    await CreatorCard.create(card);

    const result = await deleteCard({ slug: card.slug, creator_reference: card.creator_reference });

    expect(result).to.have.property('id');
    expect(result.slug).to.equal(card.slug);
    expect(result.creator_reference).to.equal(card.creator_reference);
    expect(result).to.have.property('deleted');
  });

  it('should make the card unfindable after deletion', async () => {
    const card = makeCard();
    await CreatorCard.create(card);

    await deleteCard({ slug: card.slug, creator_reference: card.creator_reference });

    const found = await CreatorCard.findOne({
      query: { slug: card.slug, creator_reference: card.creator_reference, deleted: { $eq: null } },
    });

    expect(found).to.equal(null);
  });

  it('should throw when card does not exist', async () => {
    let error;
    try {
      await deleteCard({
        slug: faker.string.alpha({ length: 8 }).toLowerCase(),
        creator_reference: faker.string.alphanumeric({ length: 20 }),
      });
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
    expect(error).to.not.equal(null);
    expect(error.message).to.equal('Creator card not found');
  });

  it('should throw when card belongs to a different creator_reference', async () => {
    const card = makeCard();
    await CreatorCard.create(card);

    let error;
    try {
      await deleteCard({
        slug: card.slug,
        creator_reference: faker.string.alphanumeric({ length: 20 }), // wrong ref
      });
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
    expect(error).to.not.equal(null);
    expect(error.message).to.equal('Creator card not found');
  });

  it('should throw when trying to delete an already-deleted card', async () => {
    const card = makeCard();
    await CreatorCard.create(card);
    await deleteCard({ slug: card.slug, creator_reference: card.creator_reference });

    let error;
    try {
      await deleteCard({ slug: card.slug, creator_reference: card.creator_reference });
    } catch (err) {
      error = err;
    }
    expect(error).to.not.equal(undefined);
    expect(error).to.not.equal(null);
    expect(error.message).to.equal('Creator card not found');
  });

  it('should throw a validation error when slug is too short', async () => {
    let error;
    try {
      await deleteCard({
        slug: 'abc',
        creator_reference: faker.string.alphanumeric({ length: 20 }),
      });
    } catch (err) {
      error = err;
    }
    expect(error).to.not.equal(undefined);
    expect(error).to.not.equal(null);
  });

  it('should throw a validation error when creator_reference is not length 20', async () => {
    let error;
    try {
      await deleteCard({ slug: 'validslug', creator_reference: 'short' });
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
    expect(error).to.not.equal(null);
  });
});
