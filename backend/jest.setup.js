jest.setTimeout(30000);

beforeAll(async () => {
  // Add any global setup
});

afterAll(async () => {
  // Ensure all handles are closed
  await new Promise(resolve => setTimeout(resolve, 500));
});