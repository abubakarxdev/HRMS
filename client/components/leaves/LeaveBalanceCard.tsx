import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface LeaveBalanceCardProps {
    type: string;
    total: number;
    used: number;
}

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ type, total, used }) => {
    const remaining = total - used;
    const percentageUsed = Math.min(100, Math.round((used / total) * 100));
    
    // Determine color based on leave type
    let colorClass = 'text-indigo-600';
    let bgClass = 'bg-indigo-50';
    let progressColor = 'bg-indigo-500';
    
    if (type.toLowerCase().includes('sick') || type.toLowerCase().includes('medical')) {
        colorClass = 'text-rose-600';
        bgClass = 'bg-rose-50';
        progressColor = 'bg-rose-500';
    } else if (type.toLowerCase().includes('casual')) {
        colorClass = 'text-amber-600';
        bgClass = 'bg-amber-50';
        progressColor = 'bg-amber-500';
    } else if (type.toLowerCase().includes('annual')) {
        colorClass = 'text-emerald-600';
        bgClass = 'bg-emerald-50';
        progressColor = 'bg-emerald-500';
    }

    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 ${bgClass} rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500`}></div>
            
            <div className="relative z-10">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{type}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                    <span className={`text-4xl font-bold ${colorClass}`}>{remaining}</span>
                    <span className="text-slate-400 font-medium text-sm">/ {total}</span>
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500">Used: {used}</span>
                        <span className={`${colorClass}`}>{percentageUsed}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${progressColor} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${percentageUsed}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveBalanceCard;
