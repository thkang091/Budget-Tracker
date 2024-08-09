import React from 'react';

const Avatar = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={`relative inline-block overflow-hidden rounded-full ${className}`}
      {...props}
    />
  );
});

Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef(({ className, src, alt = '', ...props }, ref) => {
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
      {...props}
    />
  );
});

AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={`flex h-full w-full items-center justify-center bg-gray-100 text-gray-600 ${className}`}
      {...props}
    >
      {children}
    </span>
  );
});

AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };