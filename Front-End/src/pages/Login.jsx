// Login Page - Dedicated authentication page
import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import { ArrowLeft, Shield } from 'lucide-react';

const LoginPage = ({ onSuccess, onCancel }) => {
  const [error, setError] = useState(null);

  const handleSuccess = (user) => {
    console.log('Login successful:', user);
    onSuccess?.(user);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 bg-opacity-20 rounded-full mb-6">
          <Shield className="w-10 h-10 text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-gray-300">
          Sign in to your SmartBank account
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-4 mb-6">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Login Form */}
      <LoginForm 
        onSuccess={handleSuccess}
        onError={handleError}
      />

      {/* Footer Actions */}
      <div className="mt-6 text-center space-y-4">
        <p className="text-gray-400 text-sm">
          Don't have an account?{' '}
          <button
            onClick={onCancel}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Create Account
          </button>
        </p>
        
        <button
          onClick={onCancel}
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
