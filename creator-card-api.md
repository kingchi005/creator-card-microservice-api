# Creator Card API Documentation

## Overview

The Creator Card microservice allows creators to publish shareable profile cards showcasing their links and service rates. Cards can be public or private (protected by an access code) and support draft/published statuses.

## Entity: Creator Card

### Fields

| Field                               | Type                   | Constraints                                                               | Description                                                                |
| ----------------------------------- | ---------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`                                | `string`               | ULID                                                                      | Unique identifier (serialized as `id` in responses, stored as `_id` in DB) |
| `title`                             | `string`               | Required, 3-100 characters                                                | Title/name for the creator card                                            |
| `description`                       | `string` (optional)    | Max 500 characters                                                        | Brief description of the creator/card                                      |
| `slug`                              | `string`               | 5-50 characters (a-z, 0-9, `-`, `_`), unique                              | Public URL-friendly identifier for card retrieval                          |
| `creator_reference`                 | `string`               | Required, exactly 20 characters                                           | Unique ID linking the card to its creator in the parent system             |
| `links`                             | `array` (optional)     | Each item has `title` (1-100 chars) and `url` (max 200 chars, http/https) | List of creator's links to showcase                                        |
| `service_rates`                     | `object` (optional)    | Contains `currency` (enum: NGN/USD/GBP/GHS) and non-empty `rates` array   | Creator's service rates                                                    |
| `service_rates.rates[].name`        | `string`               | Required, 3-100 characters                                                | Name of the service                                                        |
| `service_rates.rates[].description` | `string` (optional)    | Max 250 characters                                                        | Description of the service                                                 |
| `service_rates.rates[].amount`      | `number`               | Required, min 1 (minor currency units: kobo, cents, pence, pesewas)       | Price of the service                                                       |
| `status`                            | `string`               | Required, enum: `draft`/`published`                                       | Card visibility status                                                     |
| `access_type`                       | `string` (optional)    | Enum: `public`/`private`, default `public`                                | Access control type                                                        |
| `access_code`                       | `string` (conditional) | Exactly 6 alphanumeric characters, required if `access_type: private`     | PIN to access private cards                                                |
| `created`                           | `number`               | Unix timestamp (ms)                                                       | Creation timestamp                                                         |
| `updated`                           | `number`               | Unix timestamp (ms)                                                       | Last update timestamp                                                      |
| `deleted`                           | `number`/`null`        | `null` unless soft-deleted                                                | Deletion timestamp                                                         |

---

## API Endpoints

### 1. Create Creator Card

Creates a new creator card.

**Endpoint**: `POST /creator-cards`

**Request Body**:

```json
{
  "title": "George Cooks",
  "description": "George Cooks is a weekly cooking podcast by Chef George AmadiObi",
  "slug": "george-cooks",
  "creator_reference": "crt_8f2k1m9x4p7w3q5z",
  "links": [
    { "title": "YouTube Channel", "url": "https://youtube.com/@georgecooks" },
    { "title": "Instagram", "url": "https://instagram.com/georgecooks" }
  ],
  "service_rates": {
    "currency": "NGN",
    "rates": [
      { "name": "IG Story Post", "description": "One Instagram story mention", "amount": 5000000 },
      {
        "name": "Recipe Feature",
        "description": "Featured recipe segment on the podcast",
        "amount": 15000000
      }
    ]
  },
  "status": "published",
  "access_type": "public"
}
```

**Success Response (HTTP 200 OK)**:

```json
{
  "status": "success",
  "message": "Creator Card Created Successfully.",
  "data": {
    "id": "01JG8XYZA2B3C4D5E6F7G8H9J0",
    "title": "George Cooks",
    "description": "George Cooks is a weekly cooking podcast by Chef George AmadiObi",
    "slug": "george-cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "links": [
      { "title": "YouTube Channel", "url": "https://youtube.com/@georgecooks" },
      { "title": "Instagram", "url": "https://instagram.com/georgecooks" }
    ],
    "service_rates": {
      "currency": "NGN",
      "rates": [
        {
          "name": "IG Story Post",
          "description": "One Instagram story mention",
          "amount": 5000000
        },
        {
          "name": "Recipe Feature",
          "description": "Featured recipe segment on the podcast",
          "amount": 15000000
        }
      ]
    },
    "status": "published",
    "access_type": "public",
    "access_code": null,
    "created": 1718688000000,
    "updated": 1718688000000,
    "deleted": null
  }
}
```

---

### 2. Get Public Creator Card

Retrieves a single creator card by its slug (public endpoint).

**Endpoint**: `GET /creator-cards/:slug`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------------|----------|----------|--------------------------------------------|
| `access_code` | `string` | No | Required if card has `access_type: private`|

**Example**:

```
GET /creator-cards/george-cooks?access_code=A1B2C3
```

**Success Response (HTTP 200 OK)**:

```json
{
  "status": "success",
  "message": "Creator Card Retrieved Successfully.",
  "data": {
    "id": "01JG8XYZA2B3C4D5E6F7G8H9J0",
    "title": "George Cooks",
    "description": "George Cooks is a weekly cooking podcast by Chef George AmadiObi",
    "slug": "george-cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "links": [{ "title": "YouTube Channel", "url": "https://youtube.com/@georgecooks" }],
    "service_rates": {
      "currency": "NGN",
      "rates": [
        { "name": "IG Story Post", "description": "One Instagram story mention", "amount": 5000000 }
      ]
    },
    "status": "published",
    "access_type": "public",
    "created": 1718688000000,
    "updated": 1718688000000,
    "deleted": null
  }
}
```

---

### 3. Delete Creator Card

Soft-deletes a creator card (it will no longer appear in public retrievals).

**Endpoint**: `DELETE /creator-cards/:slug`

**Request Body**:

```json
{
  "creator_reference": "crt_8f2k1m9x4p7w3q5z"
}
```

**Success Response (HTTP 200 OK)**:

```json
{
  "status": "success",
  "message": "Creator Card Deleted Successfully.",
  "data": {
    "id": "01JG8XYZA2B3C4D5E6F7G8H9J0",
    "title": "George Cooks",
    "description": "George Cooks is a weekly cooking podcast by Chef George AmadiObi",
    "slug": "george-cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "links": [
      { "title": "YouTube Channel", "url": "https://youtube.com/@georgecooks" },
      { "title": "Instagram", "url": "https://instagram.com/georgecooks" }
    ],
    "service_rates": {
      "currency": "NGN",
      "rates": [
        {
          "name": "IG Story Post",
          "description": "One Instagram story mention",
          "amount": 5000000
        },
        {
          "name": "Recipe Feature",
          "description": "Featured recipe segment on the podcast",
          "amount": 15000000
        }
      ]
    },
    "status": "published",
    "access_type": "public",
    "access_code": null,
    "created": 1718688000000,
    "updated": 1718688000000,
    "deleted": 1718774400000
  }
}
```

---

## Error Codes

| Error Code         | HTTP Status | Description                                                                    |
| ------------------ | ----------- | ------------------------------------------------------------------------------ |
| `SL02`             | 400         | Slug is already taken by another card                                          |
| `AC01`             | 400         | `access_code` is required when `access_type: private`                          |
| `AC05`             | 400         | `access_code` is not allowed when `access_type: public`                        |
| `NF01`             | 404         | Creator card with given slug does not exist or is soft-deleted                 |
| `NF02`             | 404         | Creator card exists but has `status: draft` (not publicly retrievable)         |
| `AC03`             | 403         | Card is private; `access_code` query parameter is required                     |
| `AC04`             | 403         | Invalid `access_code` provided for private card                                |
| `VALIDATION_ERROR` | 400         | General input validation error that are not handled by the validator DSL (VSL) |

**Error Response Format**:

```json
{
  "status": "error",
  "message": "Slug is already taken",
  "code": "SL02"
}
```

---

## Slug Auto-Generation Rules

If no `slug` is provided in the create request, one is auto-generated from the `title` as follows:

1. Convert title to lowercase
2. Replace whitespace with hyphens
3. Remove any characters except a-z, 0-9, `-`, and `_`
4. If resulting slug is shorter than 5 characters or already exists, append a hyphen followed by a random 6-character alphanumeric suffix

---

## Project Structure

Key files for the creator-card feature:

```
creator-card-microservice-api/
├── endpoints/creator-card/
│   ├── create-card.js       # POST /creator-cards handler
│   ├── get-public-card.js   # GET /creator-cards/:slug handler
│   └── delete-card.js       # DELETE /creator-cards/:slug handler
├── services/creator-card/
│   ├── create-card.js                  # Card creation business logic
│   ├── get-public-card.js              # Card retrieval business logic
│   ├── delete-card.js                  # Card deletion business logic
│   ├── serialize-card-data.js          # Serializes card data to API responses
│   ├── generate-slug.js                # Auto-generates slugs from titles
│   └── generate-random-alphanumeric.js # Utility for random suffix generation
├── models/creator-card.js              # Mongoose model definition
├── repository/creator-card/            # Repository factory for DB operations
└── messages/creator-card.js            # Error message definitions
```
