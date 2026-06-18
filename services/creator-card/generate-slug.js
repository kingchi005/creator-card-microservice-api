const { randomBytes } = require('@app-core/randomness');
const CreatorCard = require('@app/repository/creator-card');
const generateRandomAlphanumeric = require('./generate-random-alphanumeric');

async function generateSlug(serviceData, options = {}) {
  const { title } = serviceData;

  let slug = '';
  if (title && typeof title === 'string') {
    const allowedChars = 'abcdefghijklmnopqrstuvwxyz0123456789 -_';

    slug = title
      .toLowerCase()
      .trim()
      .split('')
      .map((char) => (allowedChars.includes(char) ? char : ' '))
      .join('')
      .split(' ')
      .filter((word) => word !== '')
      .join('-');

    let needsSuffix = false;
    if (slug.length < 5) {
      needsSuffix = true;
    } else {
      const existingCard = await CreatorCard.findOne({ query: { slug } });
      if (existingCard) {
        needsSuffix = true;
      }
    }

    if (needsSuffix) {
      const suffix = generateRandomAlphanumeric({ length: 6 });
      slug = `${slug.length > 0 ? slug : 'card'}-${suffix}`;
    }
  }
  return slug;
}

module.exports = generateSlug;
