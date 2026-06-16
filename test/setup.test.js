const { createConnection } = require('@app-core/mongoose');

let connection;

before(async () => {
  const dbUri = process.env.MONGODB_URI;
  if (!dbUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  if (!connection || connection.readyState === 0) {
    await createConnection({ uri: dbUri });
  }
});

after(async () => {
  if (connection && connection.readyState !== 0) {
    await connection.close();
  }
  process.exit(0);
});
