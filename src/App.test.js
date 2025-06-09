import { render, screen } from '@testing-library/react';
import App from './App';

test('renders house finance tracker app', () => {
  render(<App />);
  const titleElement = screen.getByText(/House Finance Tracker/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders user name input', () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText(/Enter your first name/i);
  expect(inputElement).toBeInTheDocument();
});

test('renders continue button', () => {
  render(<App />);
  const buttonElement = screen.getByRole('button', { name: /continue/i });
  expect(buttonElement).toBeInTheDocument();
});
