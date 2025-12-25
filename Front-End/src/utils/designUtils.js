// Design System Utilities for SmartBank

/**
 * Get icon color class based on color name
 * This replaces dynamic Tailwind classes with predefined utilities
 */
export const getIconColorClass = (colorName) => {
  const colorMap = {
    'blue-400': 'icon-blue',
    'purple-400': 'icon-purple', 
    'green-400': 'icon-green',
    'red-400': 'icon-red',
    'yellow-400': 'icon-yellow',
    'blue': 'icon-blue',
    'purple': 'icon-purple',
    'green': 'icon-green',
    'red': 'icon-red',
    'yellow': 'icon-yellow',
  };
  
  return colorMap[colorName] || 'icon-blue';
};

/**
 * Get status color class based on connection status
 */
export const getStatusColorClass = (status) => {
  const statusMap = {
    'connected': 'status-connected',
    'disconnected': 'status-disconnected', 
    'pending': 'status-pending',
    'authenticated': 'status-connected',
    'not-authenticated': 'status-disconnected',
  };
  
  return statusMap[status] || 'status-disconnected';
};

/**
 * Generate glass morphism classes based on intensity
 */
export const getGlassClasses = (intensity = 'medium') => {
  const glassMap = {
    'light': 'bg-white bg-opacity-10 backdrop-blur-md',
    'medium': 'bg-white bg-opacity-5 backdrop-blur-md',
    'dark': 'bg-black bg-opacity-30 backdrop-blur-md',
  };
  
  return glassMap[intensity] || glassMap['medium'];
};

/**
 * Generate button classes based on variant
 */
export const getButtonClasses = (variant = 'primary', size = 'md') => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 transform hover:scale-105';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-white bg-opacity-10 hover:bg-opacity-20 text-white border border-white border-opacity-20 backdrop-blur-md',
    outline: 'bg-transparent hover:bg-white hover:bg-opacity-10 text-white border border-white border-opacity-30',
    ghost: 'bg-transparent hover:bg-white hover:bg-opacity-10 text-gray-300 hover:text-white',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};

/**
 * Animation delay utility for staggered animations
 */
export const getAnimationDelay = (index, baseDelay = 100) => {
  return `${index * baseDelay}ms`;
};

/**
 * Responsive breakpoint utilities
 */
export const getResponsiveClasses = (classes) => {
  return {
    base: classes.base || '',
    sm: classes.sm || classes.base || '',
    md: classes.md || classes.base || '',
    lg: classes.lg || classes.base || '',
    xl: classes.xl || classes.base || '',
  };
};

/**
 * Status indicator utilities
 */
export const getConnectionStatusInfo = (isConnected, isAuthenticated = false) => {
  if (isAuthenticated && isConnected) {
    return {
      text: 'Connected & Authenticated',
      className: 'text-green-400',
      icon: 'CheckCircle',
    };
  }
  
  if (isConnected) {
    return {
      text: 'Connected',
      className: 'text-blue-400', 
      icon: 'Wallet',
    };
  }
  
  return {
    text: 'Not Connected',
    className: 'text-gray-400',
    icon: 'Wallet',
  };
};

/**
 * Brand color utilities
 */
export const getBrandColor = (shade = 500) => {
  const brandColors = {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  };
  
  return brandColors[shade] || brandColors[500];
};

/**
 * Generate gradient classes
 */
export const getGradientClasses = (direction = 'br') => {
  const gradientMap = {
    'br': 'bg-gradient-to-br',
    'tr': 'bg-gradient-to-tr', 
    'bl': 'bg-gradient-to-bl',
    'tl': 'bg-gradient-to-tl',
    'r': 'bg-gradient-to-r',
    'l': 'bg-gradient-to-l',
  };
  
  return gradientMap[direction] || gradientMap['br'];
};
