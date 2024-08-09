import React from 'react';

const Alert = ({ children, variant = 'default' }) => {
  const baseClasses = 'p-4 mb-4 rounded-lg';
  const variantClasses = {
    default: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </div>
  );
};

export const AlertTitle = ({ children }) => (
  <h3 className="text-lg font-medium mb-2">{children}</h3>
);

export const AlertDescription = ({ children }) => (
  <div className="text-sm">{children}</div>
);

export default Alert;