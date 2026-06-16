/* 
| Business Rule                                       | Error Code | HTTP Code | Example Message                                       |
| --------------------------------------------------- | ---------- | --------- | ----------------------------------------------------- |
| Slug must be unique across all cards                | `SL02`     | 400       | "Slug is already taken"                               |
| access_code is required when access_type is private | `AC01`     | 400       | "access_code is required when access_type is private" |
| access_code must not be set on public cards         | `AC05`     | 400       | "access_code can only be set on private cards"        |
| Card with the given slug does not exist             | `NF01`     | 404       | "Creator card not found"                              |
| Card exists but is in draft status                  | `NF02`     | 404       | "Creator card not found"                              |
| Access code required to view private card           | `AC03`     | 403       | "This card is private. An access code is required"    |
| Invalid access code                                 | `AC04`     | 403       | "Invalid access code"                                 |

*/

module.exports = {
  SLUG_TAKEN: 'Slug is already taken', // SL02
  ACCESS_CODE_REQUIRED_ON_TYPE_PRIVATE: 'access_code is required when access_type is private', // AC01
  ACCESS_CODE_NOT_ALLOWED_ON_TYPE_PUBLIC: 'access_code can only be set on private cards', // AC05
  NOT_FOUND: 'Creator card not found', // NF01
  IS_DRAFT: 'Creator card not found', // NF02
  ACCESS_CODE_REQUIRED_ON_RETRIEVAL: 'This card is private. An access code is required', // AC03
  INVALID_ACCESS_CODE: 'Invalid access code', // AC04
};
