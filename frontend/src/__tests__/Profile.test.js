import { render, screen, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../pages/Profile';

describe('Profile Component', () => {
  const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter });
  };

  test('renders profile details', () => {
    renderWithRouter(<Profile />);
    
    // Get the profile card section first to scope our queries
    const profileSection = screen.getByRole('heading', { name: 'Profile Details' }).closest('div');
    
    // Now search within this section only
    const nameInput = within(profileSection).getByLabelText('Name');
    const emailInput = within(profileSection).getByLabelText('Email');
    const updateButton = within(profileSection).getByRole('button', { name: 'Update Profile' });
    
    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(updateButton).toBeInTheDocument();
  });

  test('displays organization tabs', () => {
    renderWithRouter(<Profile />);
    
    // Find the segmented control container by CSS class and verify it exists
    const segmentedControl = document.querySelector('.segmented-control');
    expect(segmentedControl).toBeInTheDocument();
    
    // Find the tab buttons within the segmented control
    const buttons = within(segmentedControl).getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('Create');
    expect(buttons[1]).toHaveTextContent('Join');
  });

  test('switches between create and join tabs', () => {
    renderWithRouter(<Profile />);
    
    // Default tab should be Create
    expect(screen.getByRole('heading', { name: 'Create an Organization' })).toBeInTheDocument();
    
    // Find all buttons in the UI
    const allButtons = screen.getAllByRole('button');
    
    // Find the Join tab by filtering - it should be a button with Join text
    // that has class 'segment-button'
    const joinTab = allButtons.find(
      button => button.textContent === 'Join' && button.classList.contains('segment-button')
    );
    
    expect(joinTab).toBeInTheDocument();
    fireEvent.click(joinTab);
    
    // Should now show join content
    expect(screen.getByRole('heading', { name: 'Join an Organization' })).toBeInTheDocument();
  });

  test('allows updating profile details', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    renderWithRouter(<Profile />);
    
    // Get the profile form section to scope our queries
    const profileSection = screen.getByRole('heading', { name: 'Profile Details' }).closest('div');
    
    // Now search within this section
    const nameInput = within(profileSection).getByLabelText('Name');
    const updateButton = within(profileSection).getByRole('button', { name: 'Update Profile' });

    // Change name
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
    fireEvent.click(updateButton);

    expect(consoleSpy).toHaveBeenCalledWith('Updated Profile:', { name: 'Jane Smith' });
    
    consoleSpy.mockRestore();
  });

  test('displays organization list', () => {
    renderWithRouter(<Profile />);
    
    // Find the section specifically containing the organizations list
    const orgsSection = screen.getByRole('heading', { name: 'My Organizations' }).closest('div');
    
    // Now search within this section for the list items
    expect(within(orgsSection).getByText('Organization A')).toBeInTheDocument();
    expect(within(orgsSection).getByText('Organization B')).toBeInTheDocument();
  });
});