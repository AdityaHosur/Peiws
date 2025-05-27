import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import * as api from '../services/api';

// Mock the API module
jest.mock('../services/api', () => ({
  loginUser: jest.fn()
}));

// Mock the react-router-dom useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock the ToastContext
const mockShowToast = jest.fn();
jest.mock('../components/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast
  })
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter });
  };

  test('renders login form', () => {
    renderWithRouter(<Login />);
    
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

  test('successful login redirects to dashboard', async () => {
    // Mock successful API response
    api.loginUser.mockResolvedValue({ token: 'fake-token' });
    
    renderWithRouter(<Login />);
    
    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Wait for async operations to complete
    await waitFor(() => {
      // Check if API was called with correct args
      expect(api.loginUser).toHaveBeenCalledWith('test@example.com', 'password123');
      
      // Check if token was stored in localStorage
      expect(localStorage.getItem('token')).toBe('fake-token');
      
      // Check if user was redirected to dashboard
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      
      // Check if success toast was shown
      expect(mockShowToast).toHaveBeenCalledWith('Login successful!', 'success');
    });
  });

  test('shows error on login failure', async () => {
    // Mock API failure
    const errorMessage = 'Invalid credentials';
    api.loginUser.mockRejectedValue(new Error(errorMessage));
    
    renderWithRouter(<Login />);
    
    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong-password' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Wait for async operations to complete
    await waitFor(() => {
      // Check if error toast was shown
      expect(mockShowToast).toHaveBeenCalledWith(errorMessage, 'error');
      
      // Check if error was displayed in the UI
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});