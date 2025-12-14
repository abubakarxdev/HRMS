
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, title, description, actions, footer }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-slate-200 ${className}`}>
      {(title || actions) && (
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          {title && (
             <div>
                <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
             </div>
          )}
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
      {footer && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
