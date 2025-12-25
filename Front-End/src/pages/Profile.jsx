// Profile Page - User profile management page
import React from 'react';
import UserProfile from '../components/auth/UserProfile';
import { ArrowLeft, User } from 'lucide-react';

const ProfilePage = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
            <p className="text-gray-300">
              Manage your account information and preferences
            </p>
          </div>
          
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <UserProfile />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Quick Actions</span>
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 text-left"
              >
                View Dashboard
              </button>
              
              <button
                onClick={() => onNavigate('deposit')}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 text-left"
              >
                Make Deposit
              </button>
              
              <button
                onClick={() => onNavigate('withdraw')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 text-left"
              >
                Withdraw Funds
              </button>
            </div>
          </div>

          {/* Account Security */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 p-6">
            <h3 className="text-white font-semibold mb-4">Security Tips</h3>
            
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <p>Always verify the website URL before connecting your wallet</p>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <p>Never share your private keys or seed phrase</p>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <p>Use strong passwords and enable 2FA when available</p>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <p>Regularly review your transaction history</p>
              </div>
            </div>
          </div>

          {/* Help & Support */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 p-6">
            <h3 className="text-white font-semibold mb-4">Need Help?</h3>
            
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                If you have questions about your account or need support:
              </p>
              
              <div className="space-y-1">
                <p className="text-blue-400">• Check the FAQ section</p>
                <p className="text-blue-400">• Contact our support team</p>
                <p className="text-blue-400">• Review security guidelines</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
