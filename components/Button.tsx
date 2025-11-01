import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, isLoading, className, disabled, ...props }) => {
  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className={`flex items-center justify-center px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? <LoadingSpinner size="sm" /> : children}
    </button>
  );
};