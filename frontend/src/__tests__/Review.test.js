import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Review from '../pages/Review';

describe('Review Component', () => {
  test('renders documents list and content area', () => {
    render(<Review />);

    // Check for the title
    expect(screen.getByText('Documents to Review')).toBeInTheDocument();

    // Check for the document list
    expect(screen.getByText('Research Paper')).toBeInTheDocument();
    expect(screen.getByText('Technical Report')).toBeInTheDocument();
    expect(screen.getByText('Case Study')).toBeInTheDocument();
  });

  test('switches between View and Feedback tabs', () => {
    render(<Review />);

    // Default tab should be View
    expect(screen.getByText('Select a document to view')).toBeInTheDocument();

    // Switch to Feedback tab
    const feedbackTab = screen.getByText('Feedback');
    fireEvent.click(feedbackTab);

    // Check for Feedback content
    expect(screen.getByText('Select a document to review')).toBeInTheDocument();

    // Switch back to View tab
    const viewTab = screen.getByText('View');
    fireEvent.click(viewTab);

    // Check for View content
    expect(screen.getByText('Select a document to view')).toBeInTheDocument();
  });

  test('adds a comment when the form is submitted', () => {
  render(<Review />);

  // Select a document
  const documentItem = screen.getByText('Research Paper');
  fireEvent.click(documentItem);

  // Add a comment
  const commentInput = screen.getByPlaceholderText('Add an inline comment');
  const addButton = screen.getByText('Add Comment');
  fireEvent.change(commentInput, { target: { value: 'This is a test comment' } });
  fireEvent.click(addButton);

  // Check if the comment is added
  expect(screen.getByText('This is a test comment')).toBeInTheDocument();
});

  test('updates rubric when ratings are changed', () => {
    render(<Review />);

    // Switch to Feedback tab
    const feedbackTab = screen.getByText('Feedback');
    fireEvent.click(feedbackTab);

    // Update rubric ratings
    const clarityInput = screen.getByLabelText('Clarity:');
    const grammarInput = screen.getByLabelText('Grammar:');
    const structureInput = screen.getByLabelText('Structure:');
    fireEvent.change(clarityInput, { target: { value: '4' } });
    fireEvent.change(grammarInput, { target: { value: '3' } });
    fireEvent.change(structureInput, { target: { value: '5' } });

    // Check if the rubric values are updated
    expect(clarityInput.value).toBe('4');
    expect(grammarInput.value).toBe('3');
    expect(structureInput.value).toBe('5');
  });

  test('submits feedback and logs correct data', () => {
    render(<Review />);

    // Switch to Feedback tab
    const feedbackTab = screen.getByText('Feedback');
    fireEvent.click(feedbackTab);

    // Fill out the feedback form
    const feedbackInput = screen.getByPlaceholderText('Write your feedback here');
    const summaryInput = screen.getByPlaceholderText('Write a summary of your review');
    fireEvent.change(feedbackInput, { target: { value: 'Good work overall.' } });
    fireEvent.change(summaryInput, { target: { value: 'This is a summary of the review.' } });

    // Mock console.log
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Submit the form
    const submitButton = screen.getByText('Submit Review');
    fireEvent.click(submitButton);

    // Check console logs
    expect(consoleSpy).toHaveBeenCalledWith('Feedback:', 'Good work overall.');
    expect(consoleSpy).toHaveBeenCalledWith('Rubric:', { clarity: 0, grammar: 0, structure: 0 });
    expect(consoleSpy).toHaveBeenCalledWith('Summary:', 'This is a summary of the review.');

    consoleSpy.mockRestore();
  });
});