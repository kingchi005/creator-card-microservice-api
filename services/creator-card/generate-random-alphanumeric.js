const { randomBytes } = require('@app-core/randomness');

function generateRandomAlphanumeric(serviceData = {}, options = {}) {
  const { length = 6 } = serviceData || {};
  const alphanumericChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charsLength = alphanumericChars.length;

  let result = '';

  const maxValidByteValue = 256 - (256 % charsLength);

  while (result.length < length) {
    const neededCount = length - result.length;
    const bytes = randomBytes(neededCount);

    for (let i = 0; i < bytes.length; i++) {
      const byteValue = bytes[i];

      if (byteValue < maxValidByteValue) {
        result += alphanumericChars[byteValue % charsLength];

        if (result.length === length) break;
      }
    }
  }

  return result;
}

module.exports = generateRandomAlphanumeric;
