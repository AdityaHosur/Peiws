describe('Frontend E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/'); // Visit the home page before each test
  });

  it('should toggle dark mode', () => {
    cy.get('button.theme-toggle').click(); // Click the theme toggle button
    cy.get('body').should('have.class', 'dark-mode'); // Verify dark mode is applied
    cy.get('button.theme-toggle').click(); // Click again to toggle back
    cy.get('body').should('have.class', 'light-mode'); // Verify light mode is applied
  });

  it('should navigate to the login page', () => {
    cy.get('a[href="/auth"]').click(); // Click the login link
    cy.url().should('include', '/auth'); // Verify the URL
    cy.get('h2').should('contain', 'Login'); // Verify the login page title
  });

  it('should allow file upload on the upload page', () => {
    cy.get('a[href="/upload"]').click(); // Navigate to the upload page
    cy.url().should('include', '/upload'); // Verify the URL
  });

  it('should display documents to review on the review page', () => {
    cy.get('a[href="/review"]').click(); // Navigate to the review page
    cy.url().should('include', '/review'); // Verify the URL
    cy.get('.document-item').should('have.length.greaterThan', 0); // Verify documents are listed
  });

  it('should display reviewed documents on the view page', () => {
    cy.get('a[href="/view"]').click(); // Navigate to the view page
    cy.url().should('include', '/view'); // Verify the URL
    cy.get('.document-item').should('have.length.greaterThan', 0); // Verify reviewed documents are listed
  });

  it('should display organizations on the organization page', () => {
    cy.get('a[href="/organisation"]').click(); // Navigate to the organization page
    cy.url().should('include', '/organisation'); // Verify the URL
    cy.get('.organization-item').should('have.length.greaterThan', 0); // Verify organizations are listed
  });
});