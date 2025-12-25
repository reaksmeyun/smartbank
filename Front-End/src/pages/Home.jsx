// src/pages/Home.jsx
import React, { useState } from 'react';
import { Shield, Lock, Globe, TrendingUp, ArrowRight, CheckCircle, Wallet } from 'lucide-react';
import FeatureCard from '../components/FeatureCard';
import ConnectWallet from '../components/ConnectWallet';
import { getButtonClasses } from '../utils/designUtils';

const HomePage = ({ onNavigate }) => {
  const [walletConnection, setWalletConnection] = useState(null);
  const [showConnectWallet, setShowConnectWallet] = useState(false);

  const features = [
    {
      icon: Lock,
      iconColor: "blue-400",
      title: "Secure Storage",
      description: "Your ETH is protected by smart contract security. Only you can access and withdraw your funds."
    },
    {
      icon: Globe,
      iconColor: "purple-400",
      title: "Borderless Access",
      description: "Access your funds from anywhere in the world, anytime. No intermediaries, no restrictions."
    },
    {
      icon: TrendingUp,
      iconColor: "green-400",
      title: "Full Transparency",
      description: "Track every transaction on the blockchain. Immutable history and real-time balance updates."
    }
  ];

  const benefits = [
    "Enforced savings system with structured deposits",
    "Complete transaction history tracking",
    "Input validation and safety checks",
    "Protection against common user mistakes"
  ];

  const handleWalletConnected = (connectionData) => {
    setWalletConnection(connectionData);
    setShowConnectWallet(false);
    console.log('Wallet connected:', connectionData);
  };

  const handleGetStarted = () => {
    if (walletConnection?.address) {
      // If wallet is connected, navigate to dashboard
      onNavigate('dashboard');
    } else {
      // If wallet is not connected, show connect wallet modal
      setShowConnectWallet(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-purple-900 to-pink-900 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-indigo-500/10 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center animate-slide-up">
            <div className="mb-8 relative z-10">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tighter leading-tight">
                Secure Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 animate-gradient-x">
                  Financial Future
                </span>{' '}
                on Web3
              </h1>
              <p className="text-xl md:text-2xl text-indigo-100 max-w-4xl mx-auto leading-relaxed font-light">
                Earn 5% APY on your ETH with our decentralized interest-bearing bank.
                Full transparency, complete control, and maximum security.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={handleGetStarted}
                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25"
              >
                <span className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>{walletConnection?.address ? 'Go to Dashboard' : 'Connect Wallet'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              </button>

              <button
                onClick={() => onNavigate('login')}
                className="px-8 py-4 glass-card border border-white border-opacity-20 text-white font-semibold text-lg rounded-xl hover:bg-white hover:bg-opacity-10 transition-all duration-300 transform hover:scale-105"
              >
                Learn More
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>100% Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <span>No KYC Required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-purple-400" />
                <span>Instant Transactions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why Choose SmartBank?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience the future of decentralized finance with our cutting-edge features
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <FeatureCard key={index} index={index} {...feature} />
          ))}
        </div>

        {/* Benefits Section */}
        <div className="glass-card p-12 rounded-2xl border border-white border-opacity-20 animate-scale-in">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What Makes Us Different
            </h2>
            <p className="text-gray-300 text-lg">
              Advanced features that put you in complete control
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-4 rounded-xl hover:bg-white hover:bg-opacity-5 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mt-1">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-300 text-lg leading-relaxed">{benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="text-center mt-20">
          <div className="glass-card p-12 rounded-2xl border border-white border-opacity-20">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Start Your DeFi Journey?
            </h3>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust SmartBank for their decentralized banking needs
            </p>
            <button
              onClick={() => onNavigate('register')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/25"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>

      {/* Connect Wallet Modal */}
      {showConnectWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <div className="relative">
              {/* Close button */}
              <button
                onClick={() => setShowConnectWallet(false)}
                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors z-10"
              >
                ×
              </button>

              <ConnectWallet
                onConnected={handleWalletConnected}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
