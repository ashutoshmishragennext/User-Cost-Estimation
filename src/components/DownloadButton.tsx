// components/DownloadButton.tsx
import React from 'react';
import { Download, Loader2 } from 'lucide-react';

interface DownloadButtonProps {
  onDownload: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  onDownload,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  children = 'Download'
}) => {
  const baseStyles = "inline-flex items-center gap-2 font-medium rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none";
  
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200"
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      onClick={onDownload}
      disabled={disabled || isLoading}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {children}
    </button>
  );
};

export default DownloadButton;