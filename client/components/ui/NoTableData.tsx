import React from 'react';
import { Search } from 'lucide-react';
import Button from './Button';

interface NoTableDataProps {
    title?: string;
    message?: string;
    onClearFilters?: () => void;
    icon?: React.ReactNode;
}

const NoTableData: React.FC<NoTableDataProps> = ({
    title = "No records found",
    message = "Try adjusting your filters or search query.",
    onClearFilters,
    icon
}) => {
    return (
        <tr>
            <td colSpan={100} className="px-6 py-16 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center w-full mx-auto">
                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                        {icon || <Search size={32} />}
                    </div>
                    <p className="font-medium text-slate-900">{title}</p>
                    <p className="text-sm text-slate-500">{message}</p>
                    {onClearFilters && (
                        <button 
                            onClick={onClearFilters}
                            className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default NoTableData;
