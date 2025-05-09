describe('Home Page', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('/');
  });

  it('should display the welcome message', () => {
    cy.get('h1').should('contain', 'Welcome to the Peer Review System'); // Verify the welcome message
  });

  it('should toggle dark mode', () => {
    cy.get('button.theme-toggle').click(); // Click the theme toggle button
    cy.get('body').should('have.class', 'dark-mode'); // Verify dark mode is applied
    cy.get('button.theme-toggle').click(); // Click again to toggle back
    cy.get('body').should('have.class', 'light-mode'); // Verify light mode is applied
  });

});