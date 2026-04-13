/**
 * Jest global setup — starts the Express app in test mode on port 5002
 * before the suite runs, and tears it down afterwards.
 * Tests are always isolated from any running development server.
 */

process.env.NODE_ENV = 'test';

const connectDB = require('../config/db');

let server;

beforeAll(async () => {
  // Ensure DB is connected before the health check test runs
  await connectDB();

  const { app } = require('../server');
  await new Promise((resolve, reject) => {
    server = app.listen(5002, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}, 20000);

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});
