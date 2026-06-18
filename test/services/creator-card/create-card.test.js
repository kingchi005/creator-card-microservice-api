const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const createCard = require('@app/services/creator-card/create-card');

describe('createCard Service', function () {
  this.timeout(10000);

  const makePayload = (overrides = {}) => ({
    title: faker.string.alpha({ length: 10 }),
    creator_reference: faker.string.alphanumeric({ length: 20 }),
    status: 'draft',
    ...overrides,
  });

  // ─── Happy Paths ───────────────────────────────────────────────────────────

  it('should create a card with a provided slug', async () => {
    const slug = `valid-slug-${faker.word.sample({ length: 6 }).toLowerCase()}`;

    const result = await createCard(makePayload({ slug }));

    expect(result).to.not.equal(null);
    expect(result.slug).to.equal(slug);
    expect(result).to.have.property('id');
  });

  it('should auto-generate a slug from title when slug is omitted', async () => {
    const result = await createCard(makePayload({ title: 'My Creator Card' }));

    expect(result.slug).to.not.equal(undefined);
    expect(result.slug.length).to.be.at.least(5);
  });

  it('should default access_type to public and set access_code to null when access_type is omitted', async () => {
    const result = await createCard(makePayload());

    expect(result.access_type).to.equal('public');
    expect(result.access_code).to.equal(null); // serializer omits null fields
  });

  it('should create a private card when access_type is private and access_code is provided', async () => {
    const result = await createCard(
      makePayload({
        access_type: 'private',
        access_code: faker.string.alphanumeric({ length: 6, casing: 'upper' }),
      })
    );

    expect(result.access_type).to.equal('private');
  });

  it('should create a card with links', async () => {
    const result = await createCard(
      makePayload({
        links: [{ title: 'Portfolio', url: 'https://example.com' }],
      })
    );

    expect(result.links).to.be.an('array');
    expect(result.links[0].url).to.equal('https://example.com');
  });

  it('should create a card with service_rates', async () => {
    const result = await createCard(
      makePayload({
        service_rates: {
          currency: 'NGN',
          rates: [{ name: 'IG Story', description: 'One story mention', amount: 5000 }],
        },
      })
    );

    expect(result.service_rates.currency).to.equal('NGN');
    expect(result.service_rates.rates[0].amount).to.equal(5000);
  });

  it('should throw AC05 when access_code is provided with access_type public', async () => {
    let error;
    try {
      await createCard(makePayload({ access_type: 'public', access_code: 'ABCDEF' }));
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
    expect(error.message).to.equal('access_code can only be set on private cards');
  });

  // ─── Slug Business Rules ───────────────────────────────────────────────────

  it('should throw SL02 when a client-provided slug is already taken', async () => {
    const slug = `taken-${faker.word.sample({ length: 6 }).toLowerCase()}`;
    await createCard(makePayload({ slug }));

    let error;
    try {
      await createCard(makePayload({ slug }));
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
    expect(error.message).to.equal('Slug is already taken');
  });

  // ─── Conditional access_code Rules ────────────────────────────────────────

  it('should throw AC01 when access_type is private but access_code is missing', async () => {
    let error;
    try {
      await createCard(makePayload({ access_type: 'private' }));
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
    expect(error.message).to.equal('access_code is required when access_type is private');
  });

  // ─── Validator Failures ────────────────────────────────────────────────────

  it('should throw when title is missing', async () => {
    let error;
    try {
      await createCard({
        creator_reference: faker.string.alphanumeric({ length: 20 }),
        status: 'draft',
      });
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
  });

  it('should throw when title is shorter than 3 characters', async () => {
    let error;
    try {
      await createCard(makePayload({ title: 'ab' }));
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
  });

  it('should throw when title exceeds 100 characters', async () => {
    let error;
    try {
      await createCard(makePayload({ title: faker.string.alpha({ length: 101 }) }));
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
  });

  it('should throw when creator_reference is not exactly 20 characters', async () => {
    let error;
    try {
      await createCard(makePayload({ creator_reference: 'short' }));
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
  });

  it('should throw when status is not draft or published', async () => {
    let error;
    try {
      await createCard(makePayload({ status: 'active' }));
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
  });

  it('should throw when slug is provided but shorter than 5 characters', async () => {
    let error;
    try {
      await createCard(makePayload({ slug: 'ab' }));
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
  });

  it('should throw when service_rates currency is not one of NGN, USD, GBP, GHS', async () => {
    let error;
    try {
      await createCard(
        makePayload({
          service_rates: {
            currency: 'EUR',
            rates: [{ name: 'Shoutout', description: 'A mention', amount: 1000 }],
          },
        })
      );
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
  });

  it('should throw when a rate amount is zero', async () => {
    let error;
    try {
      await createCard(
        makePayload({
          service_rates: {
            currency: 'USD',
            rates: [{ name: 'Shoutout', description: 'A mention', amount: 0 }],
          },
        })
      );
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
  });

  it('should throw when a link url does not start with http:// or https://', async () => {
    let error;
    try {
      await createCard(
        makePayload({
          links: [{ title: 'Bad Link', url: 'ftp://example.com' }],
        })
      );
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
  });

  it('should throw when access_code is not exactly 6 characters', async () => {
    let error;
    try {
      await createCard(makePayload({ access_type: 'private', access_code: 'ABC' }));
    } catch (err) {
      error = err;
    }

    expect(error).to.not.equal(undefined);
  });
});
