import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Upload from '../pages/Upload';

describe('Upload Component', () => {
  test('renders upload form with all fields', () => {
    render(<Upload />);

    // Check for file input
    expect(screen.getByLabelText(/Upload or Drag New Document/i)).toBeInTheDocument();

    // Check for tags input
    expect(screen.getByLabelText(/Add Tags or Expertise Areas/i)).toBeInTheDocument();

    // Check for visibility dropdown
    expect(screen.getByLabelText(/Choose Visibility/i)).toBeInTheDocument();

    // Check for default visibility option
    expect(screen.getByDisplayValue('Private')).toBeInTheDocument();
  });

  test('shows organization name input when visibility is set to "organization"', () => {
    render(<Upload />);

    // Change visibility to "organization"
    fireEvent.change(screen.getByLabelText(/Choose Visibility/i), {
      target: { value: 'organization' },
    });

    // Check for organization name input
    expect(screen.getByLabelText(/Organization Name/i)).toBeInTheDocument();
  });

  test('shows reviewer assignment options when visibility is not "organization"', () => {
    render(<Upload />);

    // Check for reviewer assignment dropdown
    expect(screen.getByLabelText(/Assign Reviewers/i)).toBeInTheDocument();

    // Change reviewer assignment to "manual"
    fireEvent.change(screen.getByLabelText(/Assign Reviewers/i), {
      target: { value: 'manual' },
    });

    // Check for reviewer ID input
    expect(screen.getByLabelText(/Reviewer ID/i)).toBeInTheDocument();
  });

  test('handles file upload and displays file name in console', () => {
    render(<Upload />);

    const fileInput = screen.getByLabelText(/Upload or Drag New Document/i);
    const file = new File(['dummy content'], 'example.pdf', { type: 'application/pdf' });

    // Simulate file upload
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Check if file is set
    expect(fileInput.files[0]).toBe(file);
    expect(fileInput.files).toHaveLength(1);
  });

  test('submits the form and logs correct data', () => {
  render(<Upload />);

  const fileInput = screen.getByLabelText(/Upload or Drag New Document/i);
  const tagsInput = screen.getByLabelText(/Add Tags or Expertise Areas/i);
  const visibilitySelect = screen.getByLabelText(/Choose Visibility/i);
  const submitButton = screen.getByRole('button', { name: /Upload/i }); // Use role to target the button specifically

  const file = new File(['dummy content'], 'example.pdf', { type: 'application/pdf' });

  // Simulate user input
  fireEvent.change(fileInput, { target: { files: [file] } });
  fireEvent.change(tagsInput, { target: { value: 'tag1, tag2' } });
  fireEvent.change(visibilitySelect, { target: { value: 'private' } });

  // Mock console.log
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  // Submit the form
  fireEvent.click(submitButton);

  // Check console logs
  expect(consoleSpy).toHaveBeenCalledWith('File uploaded:', file);
  expect(consoleSpy).toHaveBeenCalledWith('Tags:', 'tag1, tag2');
  expect(consoleSpy).toHaveBeenCalledWith('Visibility:', 'private');

  consoleSpy.mockRestore();
});
});