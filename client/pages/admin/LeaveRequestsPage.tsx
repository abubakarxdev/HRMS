import React, { useState } from 'react';
import { useAllLeaveRequests, useUpdateLeaveStatus } from '../../hooks/useLeaves';
import { useOptionalOffice } from '../../context/OfficeContext';
import Button from '../../components/ui/Button';
import LeaveDetailsModal from '../../components/leaves/LeaveDetailsModal';
import dayjs from 'dayjs';
import { Eye } from 'lucide-react';

const LeaveRequestsPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const officeContext = useOptionalOffice();
    const currentOfficeId = officeContext?.currentOfficeId;
    const { data: requestsData, isLoading } = useAllLeaveRequests(page, 10, statusFilter === 'all' ? undefined : statusFilter, undefined, currentOfficeId);
    const updateStatusMutation = useUpdateLeaveStatus();

    const handleViewDetails = (request: any) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const handleApprove = async (id: string, comment: string) => {
        await updateStatusMutation.mutateAsync({ id, status: 'Approved', approverComments: comment });
        setIsModalOpen(false);
    };

    const handleReject = async (id: string, comment: string) => {
        await updateStatusMutation.mutateAsync({ id, status: 'Rejected', approverComments: comment });
        setIsModalOpen(false);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="all">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">Loading...</td>
                            </tr>
                        ) : requestsData?.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">No leave requests found.</td>
                            </tr>
                        ) : (
                            requestsData?.data.map((request) => (
                                <tr key={request.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleViewDetails(request)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {request.employee?.firstName?.[0]}{request.employee?.lastName?.[0]}
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-slate-900">
                                                    {request.employee?.firstName} {request.employee?.lastName}
                                                </div>
                                                <div className="text-xs text-slate-500">{request.employee?.employeeIdNumber}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {request.leaveType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {dayjs(request.startDate).format('MMM D')} - {dayjs(request.endDate).format('MMM D, YYYY')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={request.reason}>
                                        {request.reason}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetails(request);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            <Eye size={16} className="mr-1" />
                                            View Details
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
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

            <LeaveDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                request={selectedRequest}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        </div>
    );
};

export default LeaveRequestsPage;
