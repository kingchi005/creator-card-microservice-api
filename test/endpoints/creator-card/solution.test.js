const { expect } = require('chai');
const createMockServer = require('@app-core/mock-server');
const CreatorCard = require('@app/repository/creator-card');

const server = createMockServer(['endpoints/creator-card']);

describe('Creator Card Solution Tests', function () {
  this.timeout(10000);

  // ─── Test Case 1: Full creation ────────────────────────────────────────────

  it('TC01 - should create a full card and default access_type to public', async () => {
    const { statusCode, data } = await server.post('/creator-cards', {
      body: {
        title: 'George Cooks',
        description: 'Weekly cooking podcast',
        slug: 'george-cooks',
        creator_reference: 'crt_8f2k1m9x4p7w3q5z',
        links: [{ title: 'YouTube', url: 'https://youtube.com/@georgecooks' }],
        service_rates: {
          currency: 'NGN',
          rates: [{ name: 'IG Story Post', description: 'One story mention', amount: 5000000 }],
        },
        status: 'published',
      },
    });

    expect(statusCode).to.equal(200);
    expect(data.data).to.have.property('id');
    expect(data.data).to.not.have.property('_id');
    expect(data.data.access_type).to.equal('public');
  });

  // ─── Test Case 2: Slug auto-generation ────────────────────────────────────

  it('TC02 - should auto-generate slug from title when omitted', async () => {
    const { statusCode, data } = await server.post('/creator-cards', {
      body: {
        title: 'Ada Designs Things',
        creator_reference: 'crt_a1b2c3d4e5f6g7h8',
        status: 'published',
      },
    });

    expect(statusCode).to.equal(200);
    expect(data.data.slug).to.include('ada');
    expect(data.data.slug).to.include('designs');
  });

  // ─── Test Case 3: Private card creation ───────────────────────────────────

  it('TC03 - should create a private card and return access_code in response', async () => {
    const { statusCode, data } = await server.post('/creator-cards', {
      body: {
        title: 'VIP Rate Card',
        creator_reference: 'crt_x9y8z7w6v5u4t3s2',
        status: 'published',
        access_type: 'private',
        access_code: 'A1B2C3',
      },
    });

    expect(statusCode).to.equal(200);
    expect(data.data.access_code).to.equal('A1B2C3');
  });

  // ─── Test Case 4: Retrieve a public published card ────────────────────────

  it('TC04 - should return 200 and retrieve the public card george-cooks', async () => {
    const { statusCode, data } = await server.get('/creator-cards/george-cooks');

    expect(statusCode).to.equal(200);
    expect(data.data.slug).to.equal('george-cooks');
    expect(data.data).to.have.property('id');
    expect(data.data).to.not.have.property('_id');
  });

  // ─── Test Case 5: Retrieve private card with correct access_code ──────────

  it('TC05 - should return 200 when retrieving a private card with correct access_code', async () => {
    // Find the vip-rate-card slug created in TC03 (auto-generated from title)
    const card = await CreatorCard.findOne({
      query: { creator_reference: 'crt_x9y8z7w6v5u4t3s2', deleted: { $eq: null } },
    });

    const { statusCode, data } = await server.get(`/creator-cards/${card.slug}`, {
      query: { access_code: 'A1B2C3' },
    });

    expect(statusCode).to.equal(200);
    expect(data.data.slug).to.equal(card.slug);
  });

  // ─── Test Case 6: Delete a card ───────────────────────────────────────────

  it('TC06 - should return 200 and soft-delete a card with deleted timestamp in response', async () => {
    const card = await CreatorCard.findOne({
      query: { creator_reference: 'crt_a1b2c3d4e5f6g7h8', deleted: { $eq: null } },
    });

    const { statusCode, data } = await server.delete(`/creator-cards/${card.slug}`, {
      body: { creator_reference: 'crt_a1b2c3d4e5f6g7h8' },
    });

    expect(statusCode).to.equal(200);
    expect(data.message).to.equal('Creator Card Deleted Successfully.');
    expect(data.data).to.have.property('deleted');
    expect(data.data.deleted).to.not.equal(null);
  });

  // ─── Test Case 7: Duplicate slug ──────────────────────────────────────────

  it('TC07 - should return 400 with SL02 when slug is already taken', async () => {
    const { statusCode, data } = await server.post('/creator-cards', {
      body: {
        title: 'Another George',
        slug: 'george-cooks',
        creator_reference: 'crt_m1n2b3v4c5x6z7l8',
        status: 'published',
      },
    });

    expect(statusCode).to.equal(400);
    expect(data.message).to.equal('Slug is already taken');
    expect(data.code).to.equal('SL02');
  });

  // ─── Test Case 8: Missing access_code on private card ─────────────────────

  it('TC08 - should return 400 with AC01 when access_type is private but access_code is missing', async () => {
    const { statusCode, data } = await server.post('/creator-cards', {
      body: {
        title: 'Secret Card',
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
        status: 'published',
        access_type: 'private',
      },
    });

    expect(statusCode).to.equal(400);
    expect(data.message).to.equal('access_code is required when access_type is private');
    expect(data.code).to.equal('AC01');
  });

  // ─── Test Case 9: access_code on a public card ────────────────────────────

  it('TC09 - should return 400 with AC05 when access_code is set on a public card', async () => {
    const { statusCode, data } = await server.post('/creator-cards', {
      body: {
        title: 'Public Card',
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
        status: 'published',
        access_type: 'public',
        access_code: 'A1B2C3',
      },
    });

    expect(statusCode).to.equal(400);
    expect(data.message).to.equal('access_code can only be set on private cards');
    expect(data.code).to.equal('AC05');
  });

  // ─── Test Case 9b: Non-alphanumeric access_code ────────────────────────────

  it('TC09b - should return 400 when access_code contains non-alphanumeric characters', async () => {
    const { statusCode, data } = await server.post('/creator-cards', {
      body: {
        title: 'Private Card',
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
        status: 'published',
        access_type: 'private',
        access_code: 'AB!@#$',
      },
    });

    expect(statusCode).to.equal(400);
    expect(data.message).to.equal('access_code must be alphanumeric characters');
  });

  // ─── Test Case 10: Framework validation failure ────────────────────────────

  it('TC10 - should return 400 when status is an invalid value', async () => {
    const { statusCode } = await server.post('/creator-cards', {
      body: {
        title: 'Bad Status Card',
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
        status: 'archived',
      },
    });

    expect(statusCode).to.equal(400);
  });

  // ─── Test Case 11: Retrieve non-existent card ─────────────────────────────

  it('TC11 - should return 404 with NF01 when card does not exist', async () => {
    const { statusCode, data } = await server.get('/creator-cards/does-not-exist-123');

    expect(statusCode).to.equal(404);
    expect(data.message).to.equal('Creator card not found');
    expect(data.code).to.equal('NF01');
  });

  // ─── Test Case 12: Retrieve a draft card ──────────────────────────────────

  it('TC12 - should return 404 with NF02 when card is in draft status', async () => {
    await CreatorCard.create({
      title: 'My Draft Card',
      slug: 'my-draft-card',
      creator_reference: 'crt_d1r2a3f4t5c6a7r8',
      status: 'draft',
      access_type: 'public',
      links: [],
      service_rates: { currency: 'NGN', rates: [] },
    });

    const { statusCode, data } = await server.get('/creator-cards/my-draft-card');

    expect(statusCode).to.equal(404);
    expect(data.message).to.equal('Creator card not found');
    expect(data.code).to.equal('NF02');
  });

  // ─── Test Case 13: Retrieve private card without access_code ──────────────

  it('TC13 - should return 403 with AC03 when private card accessed without access_code', async () => {
    const card = await CreatorCard.findOne({
      query: { creator_reference: 'crt_x9y8z7w6v5u4t3s2', deleted: { $eq: null } },
    });

    const { statusCode, data } = await server.get(`/creator-cards/${card.slug}`);

    expect(statusCode).to.equal(403);
    expect(data.message).to.equal('This card is private. An access code is required');
    expect(data.code).to.equal('AC03');
  });

  // ─── Test Case 14: Retrieve private card with wrong access_code ───────────

  it('TC14 - should return 403 with AC04 when wrong access_code is provided', async () => {
    const card = await CreatorCard.findOne({
      query: { creator_reference: 'crt_x9y8z7w6v5u4t3s2', deleted: { $eq: null } },
    });

    const { statusCode, data } = await server.get(`/creator-cards/${card.slug}`, {
      query: { access_code: 'WRONG1' },
    });

    expect(statusCode).to.equal(403);
    expect(data.message).to.equal('Invalid access code');
    expect(data.code).to.equal('AC04');
  });

  // ─── Test Case 15: Delete a non-existent card ─────────────────────────────

  it('TC15 - should return 404 with NF01 when deleting a non-existent card', async () => {
    const { statusCode, data } = await server.delete('/creator-cards/does-not-exist-123', {
      body: { creator_reference: 'crt_q1w2e3r4t5y6u7i8' },
    });

    expect(statusCode).to.equal(404);
    expect(data.message).to.equal('Creator card not found');
    expect(data.code).to.equal('NF01');
  });

  // ─── Test Case 16: Retrieve a deleted card ────────────────────────────────

  it('TC16 - should return 404 with NF01 when retrieving a card deleted in TC06', async () => {
    const card = await CreatorCard.findOne({
      query: { creator_reference: 'crt_a1b2c3d4e5f6g7h8' },
    });

    const { statusCode, data } = await server.get(`/creator-cards/${card.slug}`);

    expect(statusCode).to.equal(404);
    expect(data.message).to.equal('Creator card not found');
    expect(data.code).to.equal('NF01');
  });
});
