const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}', // Ensure this matches your test file naming
    baseUrl: 'http://localhost:3000', // Set your app's base URL
  },
});