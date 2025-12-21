import React from 'react';
import Button from './Button';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    onPageChange: (page: number) => void;
    className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    limit,
    onPageChange,
    className = ""
}) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalItems);

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 ${className}`}>
            <div className="text-sm text-slate-500">
                Showing <span className="font-bold text-slate-700">{startItem}</span> to <span className="font-bold text-slate-700">{endItem}</span> of <span className="font-bold text-slate-700">{totalItems}</span> results
            </div>
            
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="bg-white border-slate-200 hover:bg-slate-50"
                >
                    Previous
                </Button>
                
                <div className="flex items-center gap-1 hidden sm:flex">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let p = i + 1;
                        if (totalPages > 5) {
                            if (currentPage > 3) p = currentPage - 2 + i;
                            if (p > totalPages) p = totalPages - (4 - i);
                        }
                        
                        if (p <= 0) return null;

                        return (
                            <button
                                key={p}
                                onClick={() => onPageChange(p)}
                                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                                    currentPage === p 
                                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-100' 
                                        : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                                }`}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>

                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-white border-slate-200 hover:bg-slate-50"
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default Pagination;
