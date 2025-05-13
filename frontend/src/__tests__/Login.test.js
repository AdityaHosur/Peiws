import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';

describe('Login Component', () => {
  const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter });
  };

  test('renders login form', () => {
    renderWithRouter(<Login />);
    
    // Use heading role to specifically target the title
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('displays register link', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByText(/new to peiws\?/i)).toBeInTheDocument();
    expect(screen.getByText(/register/i)).toHaveAttribute('href', '/register');
  });

  test('allows email input', () => {
    renderWithRouter(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  test('allows password input', () => {
    renderWithRouter(<Login />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.value).toBe('password123');
  });

  test('form submission works', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    renderWithRouter(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(consoleSpy).toHaveBeenCalledWith('Login submitted:', { 
      email: 'test@example.com', 
      password: 'password123' 
    });
    
    consoleSpy.mockRestore();
  });
});