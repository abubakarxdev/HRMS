import React, { SelectHTMLAttributes } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface Option {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: Option[];
    error?: string;
}

const Select: React.FC<SelectProps> = ({ 
    label, 
    options, 
    error, 
    className = '', 
    ...props 
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    className={`
                        appearance-none block w-full rounded-lg border-slate-200 
                        text-sm focus:border-indigo-500 focus:ring-indigo-500 
                        bg-white py-2.5 pl-3 pr-10 shadow-sm transition-colors
                        disabled:bg-slate-50 disabled:text-slate-500
                        ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                        ${className}
                    `}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <FiChevronDown size={16} />
                </div>
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
};

export default Select;
