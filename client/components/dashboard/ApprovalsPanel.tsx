import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useApprovals, useUpdateApproval } from '../../hooks/useApprovals';
import { ApprovalRequest } from '../../types';

const ApprovalItem: React.FC<{ request: ApprovalRequest }> = ({ request }) => {
    const updateApprovalMutation = useUpdateApproval();

    return (
        <li className="flex items-center justify-between py-3">
            <div>
                <p className="font-semibold text-slate-800">{request.employeeName} - <span className="text-primary-600">{request.type}</span></p>
                <p className="text-sm text-slate-500">{request.details}</p>
            </div>
            <div className="flex-shrink-0 space-x-2">
                <Button 
                    size="sm" 
                    variant="success" 
                    onClick={() => updateApprovalMutation.mutate({ id: request.id, status: 'Approved' })}
                    isLoading={updateApprovalMutation.isPending}
                >
                    Approve
                </Button>
                <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => updateApprovalMutation.mutate({ id: request.id, status: 'Rejected' })}
                    isLoading={updateApprovalMutation.isPending}
                >
                    Reject
                </Button>
            </div>
        </li>
    );
}

const ApprovalsPanel: React.FC = () => {
    const { data: approvals = [], isLoading } = useApprovals();
    const pendingApprovals = approvals.filter(a => a.status === 'Pending');

    return (
        <Card title="Pending Approvals">
            {isLoading ? (
                <p>Loading approvals...</p>
            ) : pendingApprovals.length > 0 ? (
                <ul className="divide-y divide-slate-200">
                    {pendingApprovals.map(request => (
                       <ApprovalItem key={request.id} request={request} />
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-slate-900">All caught up!</h3>
                    <p className="mt-1 text-sm text-slate-500">There are no pending approvals.</p>
                </div>
            )}
        </Card>
    );
};

export default ApprovalsPanel;
