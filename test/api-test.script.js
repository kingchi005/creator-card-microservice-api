const { test } = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

test('Creator Card Microservice System Tests', { concurrency: false }, async (t) => {
  // ==========================================
  // FOLDER: create-card
  // ==========================================

  await t.test('TC1 - Full Creation (Public Default)', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      }),
    });

    assert.equal(res.status, 200);
    const response = await res.json();
    assert.ok(response.data.id, 'Response should contain an "id" field');
    assert.equal(
      response.data._id,
      undefined,
      'Response should wrap fields to expose "id", not legacy "_id"'
    );
  });

  await t.test('TC2 - Slug Auto-Generation', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Ada Designs Things',
        creator_reference: 'crt_a1b2c3d4e5f6g7h8',
        status: 'published',
      }),
    });

    assert.equal(res.status, 200);
    const response = await res.json();
    // Assuming backend auto-generates slug on creation return path
    assert.equal(response.data.slug, 'ada-designs-things');
  });

  await t.test('TC3 - Private Card Creation', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'VIP Rate Card',
        creator_reference: 'crt_x9y8z7w6v5u4t3s2',
        status: 'published',
        access_type: 'private',
        access_code: 'A1B2C3',
      }),
    });

    assert.equal(res.status, 200);
    const response = await res.json();
    assert.equal(response.data.access_code, 'A1B2C3');
  });

  await t.test('TC7 - Duplicate Slug Failure', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Another George',
        slug: 'george-cooks',
        creator_reference: 'crt_m1n2b3v4c5x6z7l8',
        status: 'published',
      }),
    });

    assert.equal(res.status, 400);
    const response = await res.json();
    assert.equal(response.code, 'SL02');
  });

  await t.test('TC8 - Missing Access Code on Private Card', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Secret Card',
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
        status: 'published',
        access_type: 'private',
      }),
    });

    assert.equal(res.status, 400);
    const response = await res.json();
    assert.equal(response.code, 'AC01');
  });

  await t.test('TC9 - Access Code Assigned to Public Card', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Public Card',
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
        status: 'published',
        access_type: 'public',
        access_code: 'A1B2C3',
      }),
    });

    assert.equal(res.status, 400);
    const response = await res.json();
    assert.equal(response.code, 'AC05');
  });

  await t.test('TC10 - Framework Validation Failure (Invalid Status)', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Bad Status Card',
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
        status: 'archived', // Framework validators should reject strings outside active choices
      }),
    });

    assert.equal(res.status, 400);
  });

  // ==========================================
  // FOLDER: get-public-card
  // ==========================================

  await t.test('TC4 - Retrieve Public Published Card', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards/george-cooks`);

    assert.equal(res.status, 200);
    const response = await res.json();
    assert.equal(
      response.data.access_code,
      undefined,
      'Public records must completely leak-protect internal codes'
    );
    assert.ok(response.data.id);
  });

  await t.test('TC5 - Retrieve Private Card with Correct Pin', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards/vip-rate-card?access_code=A1B2C3`);

    assert.equal(res.status, 200);
    const response = await res.json();
    assert.equal(
      response.data.access_code,
      undefined,
      'Access code should be stripped from final data payloads'
    );
  });

  await t.test('TC11 - Retrieve Non-Existent Card', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards/does-not-exist-123`);

    assert.equal(res.status, 404);
    const response = await res.json();
    assert.equal(response.code, 'NF01');
  });

  await t.test('TC12 - Retrieve Draft Card', async () => {
    // create 'my-draft-card'
    const createRes = await fetch(`${BASE_URL}/creator-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'My Draft Card',
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
        status: 'draft',
      }),
    });

    assert.equal(createRes.status, 200);
    const createResponse = await createRes.json();
    assert.ok(createResponse.data.id, 'Draft card must have an ID');
    assert.ok(createResponse.data.slug, 'Draft card must have a slug');

    // retrieve 'my-draft-card'
    const res = await fetch(`${BASE_URL}/creator-cards/my-draft-card`);

    assert.equal(res.status, 404);
    const response = await res.json();
    assert.equal(response.code, 'NF02');
  });

  await t.test('TC13 - Retrieve Private Card Without Pin', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards/vip-rate-card`);

    assert.equal(res.status, 403);
    const response = await res.json();
    assert.equal(response.code, 'AC03');
  });

  await t.test('TC14 - Retrieve Private Card with Wrong Pin', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards/vip-rate-card?access_code=WRONG1`);

    assert.equal(res.status, 403);
    const response = await res.json();
    assert.equal(response.code, 'AC04');
  });

  // ==========================================
  // FOLDER: delete-card
  // ==========================================

  await t.test('TC6 - Delete an Existing Card', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards/ada-designs-things`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creator_reference: 'crt_a1b2c3d4e5f6g7h8' }),
    });

    assert.equal(res.status, 200);
    const response = await res.json();
    assert.ok(response.data.deleted, 'Soft deletion timestamp must be updated in response payload');
  });

  await t.test('TC15 - Delete Non-Existent Card', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards/does-not-exist-123`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creator_reference: 'crt_q1w2e3r4t5y6u7i8' }),
    });

    assert.equal(res.status, 404);
    const response = await res.json();
    assert.equal(response.code, 'NF01');
  });

  // ==========================================
  // POST-CONDITION SANITY MATCH (get-public-card dependency)
  // ==========================================

  await t.test('TC16 - Retrieve Recently Deleted Card', async () => {
    const res = await fetch(`${BASE_URL}/creator-cards/ada-designs-things`);

    assert.equal(res.status, 404);
    const response = await res.json();
    assert.equal(response.code, 'NF01');
  });
});
