const { expect } = require('chai');
const { ulid } = require('@app-core/randomness');
const CreatorCard = require('@app/repository/creator-card');
const { DatabaseModel, createConnection } = require('@app-core/mongoose');
const { faker } = require('@faker-js/faker');

describe('CreatorCard Repository - Core Retrieval & Creation Tests', function () {
  this.timeout(10000);

  before(async () => {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

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

  describe('create', () => {
    it('should successfully create a new creator card', async () => {
      const randomTitle = faker.string.alpha({ length: faker.number.int({ min: 5, max: 50 }) });

      const cleanSlugStr =
        `${faker.helpers.slugify(randomTitle).substring(0, 20)}-${ulid().substring(0, 10)}`.toLowerCase();

      const cardPayload = {
        title: randomTitle,
        description: faker.lorem.sentence().substring(0, 500),
        slug: cleanSlugStr,
        // creator_reference must be exactly 20 characters based on spec: <length:20>
        creator_reference: faker.string.alphanumeric({ length: 20 }),
        links: [
          {
            title: faker.string.alpha({ length: faker.number.int({ min: 3, max: 30 }) }),
            url: `https://${faker.internet.domainName()}`,
          },
          {
            title: faker.string.alpha({ length: faker.number.int({ min: 3, max: 30 }) }),
            url: `https://${faker.internet.domainName()}`,
          },
        ],
        service_rates: {
          currency: faker.helpers.arrayElement(['NGN', 'USD', 'GBP', 'GHS']),
          rates: [
            {
              name: 'IG Story Post',
              description: faker.lorem.sentence().substring(0, 250),
              amount: faker.number.int({ min: 100, max: 1000000 }), // Minor units (e.g. kobo/cents) >= 1
            },
          ],
        },
        status: faker.helpers.arrayElement(['draft', 'published']),
        access_type: 'private',
        // access_code must be exactly 6 characters based on spec: <length:6>
        access_code: faker.string.alphanumeric({ length: 6, casing: 'upper' }),
      };

      const result = await CreatorCard.create(cardPayload);

      expect(result).to.have.property('_id');
      expect(result.title).to.equal(cardPayload.title);
      expect(result.slug).to.equal(cardPayload.slug);
      expect(result.creator_reference).to.have.lengthOf(20);
      expect(result.links[0].url).to.match(/^https:\/\//);
      expect(result.service_rates.rates[0].amount).to.be.at.least(1);
      expect(['draft', 'published']).to.include(result.status);
      expect(['public', 'private']).to.include(result.access_type);
      expect(result.access_code).to.have.lengthOf(6);
    });
  });
  describe('findOne', () => {
    it('should find a single card matching target criteria constraints', async () => {
      const generatedSlug = faker.string.alpha({ length: 10 }).toLowerCase();

      await CreatorCard.create({
        title: 'Valid FindOne Target',
        description: 'Biographical info goes here.',
        slug: generatedSlug,
        creator_reference: faker.string.alphanumeric({ length: 20 }),
        links: [{ title: 'Main Portfolio', url: 'https://example.com' }],
        service_rates: {
          currency: 'USD',
          rates: [{ name: 'Shoutout', description: 'Brief mention', amount: 5000 }],
        },
        status: 'published',
        access_type: 'public',
      });

      const result = await CreatorCard.findOne({
        query: { slug: generatedSlug, status: 'published' },
      });

      expect(result).to.not.equal(null);
      expect(result.slug).to.equal(generatedSlug);
      expect(result.status).to.equal('published');
    });
  });

  describe('findMany', () => {
    it('should fetch collection records corresponding to target lookup parameters', async () => {
      const commonRef = faker.string.alphanumeric({ length: 20 });

      // Seed dual elements belonging to the same creator entity pointer reference
      await CreatorCard.create({
        title: 'Card Set Alpha',
        slug: `alpha-${faker.string.alpha({ length: 6 }).toLowerCase()}`,
        creator_reference: commonRef,
        status: 'published',
        access_type: 'public',
        service_rates: { currency: 'NGN', rates: [] },
      });

      await CreatorCard.create({
        title: 'Card Set Beta',
        slug: `beta-${faker.string.alpha({ length: 6 }).toLowerCase()}`,
        creator_reference: commonRef,
        status: 'published',
        access_type: 'public',
        service_rates: { currency: 'NGN', rates: [] },
      });

      const result = await CreatorCard.findMany({
        query: { creator_reference: commonRef, status: 'published' },
        options: { sort: { created: -1 } },
      });

      expect(result).to.be.an('array');
      expect(result.length).to.be.at.least(2);
      expect(result[0].creator_reference).to.equal(commonRef);
    });
  });
});
