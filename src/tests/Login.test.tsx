import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { AuthProvider } from '../auth/AuthContext';

describe('LoginPage', () => {
  it('renders login screen with industrial branding and inputs', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText(/ENGINEER ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/PASSWORD/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue securely/i })).toBeInTheDocument();
  });

  it('allows clicking quick development roles to switch credentials', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const adminBtn = screen.getByRole('button', { name: 'Admin' });
    fireEvent.click(adminBtn);

    const emailInput = screen.getByLabelText(/ENGINEER ID/i) as HTMLInputElement;
    expect(emailInput.value).toBe('admin@iems.industrial');
  });
});
