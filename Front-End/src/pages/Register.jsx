// Register Page - Dedicated registration page
import React, { useState } from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import { ArrowLeft, UserPlus } from 'lucide-react';

const RegisterPage = ({ onSuccess, onCancel }) => {
  const [error, setError] = useState(null);

  const handleSuccess = (user) => {
    console.log('Registration successful:', user);
    onSuccess?.(user);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 bg-opacity-20 rounded-full mb-6">
          <UserPlus className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-300">
          Join SmartBank and start your Web3 banking journey
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-4 mb-6">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Registration Form */}
      <RegisterForm 
        onSuccess={handleSuccess}
        onError={handleError}
      />

      {/* Footer Actions */}
      <div className="mt-6 text-center space-y-4">
        <p className="text-gray-400 text-sm">
          Already have an account?{' '}
          <button
            onClick={onCancel}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Sign In
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

export default RegisterPage;
