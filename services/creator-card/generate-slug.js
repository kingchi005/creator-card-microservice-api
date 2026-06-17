const { ulid } = require('@app-core/randomness');

/**
 * Generates a url-safe kebab-case slug without using regex.
 * @param {string} title
 * @returns {string}
 */
function generateSlug(title) {
  if (!title || typeof title !== 'string') {
    return '';
  }

  const allowedChars = 'abcdefghijklmnopqrstuvwxyz0123456789 ';

  const cleanTitle = title
    .toLowerCase()
    .trim()
    .split('')
    .map((char) => (char === '-' ? ' ' : char))
    .filter((char) => allowedChars.includes(char))
    .join('')
    .split(' ')
    .filter((word) => word !== '')
    .join('-');

  const uniqueHash = ulid().toLowerCase().substring(0, 8);
  const slug = `${cleanTitle}-${uniqueHash}`;

  return slug;
}

module.exports = generateSlug;
