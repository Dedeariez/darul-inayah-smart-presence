
import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('rounded-xl border bg-white text-gray-900 shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardProps> = ({ className, children, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
    {children}
  </div>
);

const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props}>
    {children}
  </h3>
);

const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={cn('text-sm text-gray-500', className)} {...props}>
    {children}
  </p>
);

const CardContent: React.FC<CardProps> = ({ className, children, ...props }) => (
  <div className={cn('p-6 pt-0', className)} {...props}>
    {children}
  </div>
);

const CardFooter: React.FC<CardProps> = ({ className, children, ...props }) => (
  <div className={cn('flex items-center p-6 pt-0', className)} {...props}>
    {children}
  </div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
