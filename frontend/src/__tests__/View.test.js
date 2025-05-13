import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import View from '../pages/View';

describe('View Component', () => {
  test('renders document list and content area', () => {
    render(<View />);

    // Check for the title
    expect(screen.getByText('Reviewed Documents')).toBeInTheDocument();

    // Check for the document list
    expect(screen.getByText('Research Paper')).toBeInTheDocument();
    expect(screen.getByText('Technical Report')).toBeInTheDocument();
    expect(screen.getByText('Case Study')).toBeInTheDocument();
  });

  test('displays comments for the selected document and version', () => {
    render(<View />);

    // Select a document
    const documentItem = screen.getByText('Research Paper');
    fireEvent.click(documentItem);

    // Check for comments section title
    expect(screen.getByText('Comments for Research Paper')).toBeInTheDocument();

    // Check for comments of version 1
    expect(screen.getByText('Improve the introduction.')).toBeInTheDocument();
    expect(screen.getByText('Fix grammar in section 2.')).toBeInTheDocument();

    // Change to version 2
    fireEvent.change(screen.getByLabelText('Select Version'), {
      target: { value: 'v2' },
    });

    // Check for comments of version 2
    expect(screen.getByText('Add more examples in section 3.')).toBeInTheDocument();
  });

  test('handles feedback actions for comments', () => {
    render(<View />);

    // Select a document
    const documentItem = screen.getByText('Research Paper');
    fireEvent.click(documentItem);

    // Accept a comment
    const acceptButton = screen.getAllByText('Accept')[0];
    fireEvent.click(acceptButton);

    // Check if the status is updated
    expect(screen.getByText('accepted')).toBeInTheDocument();

    // Reject a comment
    const rejectButton = screen.getAllByText('Reject')[1];
    fireEvent.click(rejectButton);

    // Check if the status is updated
    expect(screen.getByText('rejected')).toBeInTheDocument();
  });

  test('switches between Comments and Compare Versions tabs', () => {
    render(<View />);

    // Check default tab is Comments
    expect(screen.getByText('Select a document to view comments')).toBeInTheDocument();

    // Switch to Compare Versions tab
    const compareTab = screen.getByText('Compare Versions');
    fireEvent.click(compareTab);

    // Check for Compare Versions content
    expect(screen.getByText('Select a document to compare versions')).toBeInTheDocument();

    // Switch back to Comments tab
    const commentsTab = screen.getByText('Comments');
    fireEvent.click(commentsTab);

    // Check for Comments content
    expect(screen.getByText('Select a document to view comments')).toBeInTheDocument();
  });

  test('displays version comparison for the selected document', () => {
    render(<View />);

    // Select a document
    const documentItem = screen.getByText('Research Paper');
    fireEvent.click(documentItem);

    // Switch to Compare Versions tab
    const compareTab = screen.getByText('Compare Versions');
    fireEvent.click(compareTab);

    // Check for version comparison content
    expect(screen.getByText('Compare Versions for Research Paper')).toBeInTheDocument();
    expect(screen.getByText('This is the content of Version 1.')).toBeInTheDocument();
    expect(screen.getByText('This is the content of Version 2 with additional examples.')).toBeInTheDocument();
  });
});