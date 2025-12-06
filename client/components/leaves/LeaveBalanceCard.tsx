import React from 'react';

interface LeaveBalanceCardProps {
    type: string;
    total: number;
    used: number;
}

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ type, total, used }) => {
    const available = total - used;
    const percentage = Math.min(100, (used / total) * 100);
    
    // Determine color based on type
    const getColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'annual': return 'bg-blue-500';
            case 'medical': return 'bg-red-500';
            case 'sick': return 'bg-red-500';
            case 'casual': return 'bg-yellow-500';
            case 'maternity': return 'bg-pink-500';
            default: return 'bg-indigo-500';
        }
    };

    const colorClass = getColor(type);

    return (
        <div className="bg-white rounded-lg shadow-sm p-5 border border-slate-200">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-medium text-slate-500">{type}</h3>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Available</span>
            </div>
            <div className="flex items-baseline gap-1 mb-4">
                <span className={`text-3xl font-bold ${type.toLowerCase() === 'annual' ? 'text-blue-600' : 'text-slate-800'}`}>
                    {available}
                </span>
                <span className="text-sm text-slate-400">/ {total}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div 
                    className={`${colorClass} h-1.5 rounded-full transition-all duration-500`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export default LeaveBalanceCard;
