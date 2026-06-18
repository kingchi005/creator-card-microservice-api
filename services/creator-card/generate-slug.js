const { appLogger } = require('@app-core/logger');
const { ulid } = require('@app-core/randomness');
const CreatorCard = require('@app/repository/creator-card');

/**
 * Generates a url-safe kebab-case slug without using regex.
 * @param {string} title
 * @returns {Promise<string>}
 */
async function generateSlug(title) {
  let slug = '';
  if (title && typeof title === 'string') {
    const allowedChars = 'abcdefghijklmnopqrstuvwxyz0123456789 ';

    slug = title
      .toLowerCase()
      .trim()
      .split('')
      .map((char) => (char === '-' ? ' ' : char))
      .filter((char) => allowedChars.includes(char))
      .join('')
      .split(' ')
      .filter((word) => word !== '')
      .join('-');

    try {
      // ensure the slug is unique
      const existingCard = await CreatorCard.findOne({ query: { slug } });
      if (existingCard) {
        const uniqueHash = ulid().toLowerCase().substring(0, 8);
        slug = `${slug}-${uniqueHash}`;
      }
    } catch (error) {
      appLogger.error('Error generating slug:', error);
      throw error;
    }
  }
  return slug;
}

module.exports = generateSlug;
