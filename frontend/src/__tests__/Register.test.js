import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';

describe('Register Component', () => {
  const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter });
  };

  test('renders register form', () => {
    renderWithRouter(<Register />);
    
    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  test('displays login link', () => {
    renderWithRouter(<Register />);
    
    expect(screen.getByText(/have an account in peiws\?/i)).toBeInTheDocument();
    expect(screen.getByText(/login/i)).toHaveAttribute('href', '/auth');
  });

  test('allows name input', () => {
    renderWithRouter(<Register />);
    
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    expect(nameInput.value).toBe('John Doe');
  });

  test('allows email input', () => {
    renderWithRouter(<Register />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  test('allows password input', () => {
    renderWithRouter(<Register />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.value).toBe('password123');
  });

  test('form submission works', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    renderWithRouter(<Register />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(consoleSpy).toHaveBeenCalledWith('Registration submitted:', { 
      name: 'John Doe',
      email: 'test@example.com', 
      password: 'password123' 
    });
    
    consoleSpy.mockRestore();
  });
});