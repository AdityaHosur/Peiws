import { render, screen } from '@testing-library/react';
import CardLayout from '../components/CardLayout';

describe('CardLayout Component', () => {
  test('renders children properly', () => {
    render(
      <CardLayout>
        <div data-testid="test-child">Child Content</div>
      </CardLayout>
    );
    
    const childElement = screen.getByTestId('test-child');
    expect(childElement).toBeInTheDocument();
    expect(childElement).toHaveTextContent('Child Content');
  });
});