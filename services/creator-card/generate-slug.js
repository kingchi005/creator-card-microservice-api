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

  const slug = title
    .toLowerCase()
    .trim()
    .split('')
    .map((char) => (char === '-' ? ' ' : char))
    .filter((char) => allowedChars.includes(char))
    .join('')
    .split(' ')
    .filter((word) => word !== '')
    .join('-');

  return slug;
}

module.exports = generateSlug;
