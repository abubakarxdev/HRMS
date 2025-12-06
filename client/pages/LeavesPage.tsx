import React, { useState } from 'react';
import { useLeaveBalances, useMyLeaveRequests, useCreateLeaveRequest } from '../hooks/useLeaves';
import LeaveBalanceCard from '../components/leaves/LeaveBalanceCard';
import LeaveHistoryTable from '../components/leaves/LeaveHistoryTable';
import LeaveRequestModal from '../components/leaves/LeaveRequestModal';
import Button from '../components/ui/Button';
import { Plus } from 'lucide-react';

const LeavesPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    
    const { data: balances, isLoading: loadingBalances } = useLeaveBalances();
    const { data: requestsData, isLoading: loadingRequests } = useMyLeaveRequests(page);
    const createRequestMutation = useCreateLeaveRequest();

    const handleCreateRequest = async (data: any) => {
        await createRequestMutation.mutateAsync(data);
    };

    const leaveTypes = balances?.map(b => b.leaveType) || ['Annual', 'Medical', 'Casual', 'Maternity', 'Others'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-700">My Leave Balances ({new Date().getFullYear()})</h2>
                <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                    <Plus size={16} />
                    Request Leave
                </Button>
            </div>

            <div className="space-y-4">

                {loadingBalances ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse"></div>
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
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-700">Leave Request History</h2>
                <LeaveHistoryTable 
                    requests={requestsData?.data || []} 
                    loading={loadingRequests} 
                />
                
                {/* Simple Pagination for now */}
                {requestsData?.meta && requestsData.meta.totalPages > 1 && (
                    <div className="flex justify-end gap-2">
                        <Button 
                            variant="secondary" 
                            disabled={page === 1} 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center text-sm text-slate-600">
                            Page {page} of {requestsData.meta.totalPages}
                        </span>
                        <Button 
                            variant="secondary" 
                            disabled={page === requestsData.meta.totalPages} 
                            onClick={() => setPage(p => Math.min(requestsData.meta.totalPages, p + 1))}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>

            <LeaveRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateRequest}
                leaveTypes={leaveTypes}
            />
        </div>
    );
};

export default LeavesPage;
