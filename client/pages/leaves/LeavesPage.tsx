import React, { useState } from 'react';
import { useLeaveBalances , useMyLeaveRequests , useCreateLeaveRequest } from '@/hooks/useLeaves';
import LeaveBalanceCard from '@/components/leaves/LeaveBalanceCard';
import LeaveHistoryTable from '@/components/leaves/LeaveHistoryTable';
import LeaveRequestModal from '@/components/leaves/LeaveRequestModal';
import Button from '@/components/ui/Button';
import { Plus, Calendar, Clock, CheckCircle } from 'lucide-react';
import { FiActivity, FiFilter } from 'react-icons/fi';
import Pagination from '@/components/ui/Pagination';
import dayjs from 'dayjs';

const LeavesPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Default to Current Year (Jan 1 - Dec 31)
    const [startDate, setStartDate] = useState(dayjs().startOf('year').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs().endOf('year').format('YYYY-MM-DD'));
    
    const { data: balances, isLoading: loadingBalances } = useLeaveBalances();
    const { data: requestsData, isLoading: loadingRequests } = useMyLeaveRequests(page, 10, statusFilter === 'all' ? undefined : statusFilter, startDate || undefined, endDate || undefined);
    const createRequestMutation = useCreateLeaveRequest();

    const handleCreateRequest = async (data: any) => {
        await createRequestMutation.mutateAsync(data);
    };



    // Calculate aggregated stats
    // Used: Count everything (History remains)
    const totalUsed = balances?.reduce((acc, curr) => acc + curr.usedCredits, 0) || 0;
    
    // Available: Only count from Active policies (Archived credits are lost)
    const totalRemaining = balances?.reduce((acc, curr) => {
        if (curr.isArchived) return acc;
        return acc + (curr.totalCredits - curr.usedCredits);
    }, 0) || 0;

    // Total: Effective Total (Used + Available). 
    // This represents "Useful Credits" (what you used + what you have left).
    const totalLeaves = totalUsed + totalRemaining;

    const pendingRequests = requestsData?.data?.filter(r => r.status === 'PENDING').length || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Glassmorphism Header */}
            <header className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
                 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                 <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>

                 <div className="relative z-10 flex flex-col justify-between gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                 <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                                    <Calendar className="w-6 h-6 text-white" />
                                 </div>
                                 <h1 className="text-3xl font-bold tracking-tight">My Leaves</h1>
                            </div>
                            <p className="text-indigo-100 max-w-lg text-lg">
                                Manage your time off and view leave balances.
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsModalOpen(true)} 
                            className="bg-white text-indigo-600 hover:bg-indigo-50 border border-transparent shadow-lg shadow-black/10 transition-all hover:scale-105 active:scale-95 font-bold px-6 py-3 rounded-xl flex items-center gap-2 group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                            Request Leave
                        </button>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-2 border-t border-white/10">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 text-indigo-200 mb-1" title="Effective Credits = Available credits from active policies + historical usage from archived policies">
                                <Clock size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Effective Credits</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{totalLeaves}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 text-emerald-300 mb-1">
                                <CheckCircle size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Available</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{totalRemaining}</p>
                        </div>
                         <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 text-amber-300 mb-1">
                                <FiActivity size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Used</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{totalUsed}</p>
                        </div>
                         <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 text-blue-300 mb-1">
                                <Clock size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Pending</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{pendingRequests}</p>
                        </div>
                    </div>
                 </div>
            </header>

            {/* Balances Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Leave Balances <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">{new Date().getFullYear()}</span>
                    </h2>
                </div>

                {loadingBalances ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse border border-slate-200"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {balances?.map(balance => (
                            <LeaveBalanceCard
                                key={balance.id}
                                type={balance.leaveType}
                                total={balance.totalCredits}
                                used={balance.usedCredits}
                                isArchived={balance.isArchived} // Pass backend status
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* History Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-bold text-slate-800">Request History</h2>
                        <div className="text-sm text-slate-500">
                            Total Requests: <span className="font-bold text-slate-800">{requestsData?.meta?.total || 0}</span>
                        </div>
                    </div>
                    
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                         <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-600 font-medium cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            <option value="all">All Status</option>
                            <option value="Approved">Approved</option>
                            <option value="Pending">Pending</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">From</span>
                             <input 
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPage(1);
                                }}
                                className="text-sm text-slate-600 outline-none bg-transparent font-medium"
                             />
                        </div>

                         <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">To</span>
                             <input 
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPage(1);
                                }}
                                className="text-sm text-slate-600 outline-none bg-transparent font-medium"
                             />
                        </div>

                        {(statusFilter !== 'all' || startDate !== dayjs().startOf('year').format('YYYY-MM-DD') || endDate !== dayjs().endOf('year').format('YYYY-MM-DD')) && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStatusFilter('all');
                                    setStartDate(dayjs().startOf('year').format('YYYY-MM-DD'));
                                    setEndDate(dayjs().endOf('year').format('YYYY-MM-DD'));
                                    setPage(1);
                                }}
                                className="bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200 hover:border-indigo-200 rounded-xl font-semibold transition-all px-4 py-2 h-auto"
                            >
                                Reset Filters
                            </Button>
                        )}
                    </div>
                </div>
                
                <LeaveHistoryTable 
                    requests={requestsData?.data || []} 
                    loading={loadingRequests} 
                />
                
                {requestsData?.meta && (
                     <div className="border-t border-slate-100 bg-slate-50/50">
                        <Pagination 
                            currentPage={page}
                            totalPages={requestsData.meta.totalPages}
                            totalItems={requestsData.meta.total}
                            limit={10} 
                            onPageChange={(p) => setPage(p)}
                        />
                    </div>
                )}
            </div>

            <LeaveRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateRequest}
            />
        </div>
    );
};

export default LeavesPage;
