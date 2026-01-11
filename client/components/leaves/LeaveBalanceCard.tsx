import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface LeaveBalanceCardProps {
    type: string;
    total: number;
    used: number;
    compact?: boolean;
    isArchived?: boolean;
}

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ type, total, used, compact, isArchived }) => {
    const remaining = total - used;
    const percentageUsed = Math.min(100, Math.round((used / total) * 100));
    
    // Determine color based on leave type or Archived status
    let colorClass = 'text-indigo-600';
    let bgClass = 'bg-indigo-50';
    let progressColor = 'bg-indigo-500';
    
    if (isArchived) {
        colorClass = 'text-slate-500';
        bgClass = 'bg-slate-100';
        progressColor = 'bg-slate-400';
    } else if (type.toLowerCase().includes('sick') || type.toLowerCase().includes('medical')) {
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

    if (compact) {
        return (
            <div className={`bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden group ${isArchived ? 'opacity-75 grayscale' : ''}`}>
                 <div className={`absolute top-0 right-0 w-16 h-16 ${bgClass} rounded-bl-full -mr-4 -mt-4 opacity-50`}></div>
                 <div className="relative z-10 flex justify-between items-end">
                     <div>
                        <div className="flex items-center gap-2">
                             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{type}</h3>
                             {isArchived && <span className="text-[10px] bg-slate-200 px-1 rounded text-slate-600 border border-slate-300">Archived</span>}
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-bold ${colorClass}`}>{remaining}</span>
                            <span className="text-slate-400 font-medium text-xs">/ {total}</span>
                        </div>
                     </div>
                     <div className="text-right">
                         <span className="text-xs font-bold text-slate-400 block mb-1">Used</span>
                         <span className={`text-sm font-bold ${colorClass}`}>{used} <span className="text-[10px] text-slate-400 font-normal">({percentageUsed}%)</span></span>
                     </div>
                 </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group ${isArchived ? 'opacity-80' : ''}`}>
            <div className={`absolute top-0 right-0 w-24 h-24 ${bgClass} rounded-bl-full -mr-4 -mt-4 opacity-50 ${!isArchived ? 'group-hover:scale-110' : ''} transition-transform duration-500`}></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{type}</h3>
                    {isArchived && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Archived
                        </span>
                    )}
                </div>
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
