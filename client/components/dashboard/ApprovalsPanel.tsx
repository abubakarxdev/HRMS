import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAllLeaveRequests, useUpdateLeaveStatus } from '../../hooks/useLeaves';
import dayjs from 'dayjs';
import LeaveDetailsModal from '../leaves/LeaveDetailsModal';

const ApprovalItem: React.FC<{ request: any; onUpdate: (id: string, status: string, comment: string) => void; onView: (req: any) => void }> = ({ request, onUpdate, onView }) => {
    return (
        <li className="flex items-center justify-between py-4 hover:bg-slate-50 transition-colors rounded-lg px-2 -mx-2">
            <div className="flex items-center space-x-4 cursor-pointer flex-grow" onClick={() => onView(request)}>
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {request.employee?.firstName?.[0]}{request.employee?.lastName?.[0]}
                </div>
                <div>
                    <p className="font-semibold text-slate-800">
                        {request.employee?.firstName} {request.employee?.lastName}
                    </p>
                    <div className="flex items-center text-sm text-slate-500 space-x-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                            request.leaveType === 'Sick' ? 'bg-red-500' :
                            request.leaveType === 'Annual' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}></span>
                        <span>{request.leaveType}</span>
                        <span>•</span>
                        <span>{dayjs(request.startDate).format('MMM D')} - {dayjs(request.endDate).format('MMM D, YYYY')}</span>
                    </div>
                </div>
            </div>
            <div className="flex-shrink-0 space-x-2">
                <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onView(request)}
                    className="text-slate-600 hover:text-indigo-600 border-slate-200 hover:border-indigo-200"
                >
                    Review
                </Button>
            </div>
        </li>
    );
}

import { useOptionalOffice } from '@/context/OfficeContext';

const ApprovalsPanel: React.FC = () => {
    const officeContext = useOptionalOffice();
    const currentOfficeId = officeContext?.currentOfficeId;
    
    // Pass officeId to filter requests. 
    // For Admins: Filters by selected office (or undefined for all if switcher allows).
    // For HR/Employee: Backend overrides this with their fixed officeId anyway.
    const { data: response, isLoading } = useAllLeaveRequests(1, 5, 'Pending', undefined, currentOfficeId);
    const updateStatusMutation = useUpdateLeaveStatus();
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const pendingApprovals = response?.data || [];

    const handleUpdate = (id: string, status: string, comment: string) => {
        updateStatusMutation.mutate({ id, status, approverComments: comment }, {
            onSuccess: () => {
                setIsModalOpen(false);
            }
        });
    };

    const handleView = (request: any) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    return (
        <>
            <Card title="Pending Approvals">
                {isLoading ? (
                    <p className="text-slate-500 text-sm py-4">Loading approvals...</p>
                ) : pendingApprovals.length > 0 ? (
                    <ul className="divide-y divide-slate-200">
                        {pendingApprovals.map((request: any) => (
                           <ApprovalItem 
                                key={request.id} 
                                request={request} 
                                onUpdate={handleUpdate}
                                onView={handleView}
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-12">
                        <div className="mx-auto h-12 w-12 text-slate-300 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">All caught up!</h3>
                        <p className="mt-1 text-sm text-slate-500">No pending leave requests to review.</p>
                    </div>
                )}
            </Card>

            <LeaveDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                request={selectedRequest}
                onApprove={(id, comment) => handleUpdate(id, 'Approved', comment)}
                onReject={(id, comment) => handleUpdate(id, 'Rejected', comment)}
            />
        </>
    );
};

export default ApprovalsPanel;
