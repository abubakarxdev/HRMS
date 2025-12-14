import React, { useState } from 'react';
import dayjs from 'dayjs';
import LeaveDetailsModal from './LeaveDetailsModal';
import Button from '../ui/Button';
import { Eye } from 'lucide-react';
import { LeaveRequest } from '../../api/types/leaves';

interface LeaveHistoryTableProps {
    requests: LeaveRequest[];
    loading: boolean;
}

const LeaveHistoryTable: React.FC<LeaveHistoryTableProps> = ({ requests, loading }) => {
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewDetails = (request: LeaveRequest) => {
        // Mock employee object if missing, as modal expects it
        const requestWithEmployee = {
            ...request,
            employee: request.employee || { firstName: 'Me', lastName: '', employeeIdNumber: '' }
        };
        setSelectedRequest(requestWithEmployee);
        setIsModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <>
            <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Applied On</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">Loading...</td>
                            </tr>
                        ) : requests.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">No leave requests found.</td>
                            </tr>
                        ) : (
                            requests.map((request) => (
                                <tr key={request.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleViewDetails(request)}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                        {request.leaveType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {dayjs(request.startDate).format('MMM D, YYYY')} - {dayjs(request.endDate).format('MMM D, YYYY')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={request.reason}>
                                        {request.reason}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {dayjs(request.createdAt).format('MMM D, YYYY')}
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
                                            View
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <LeaveDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                request={selectedRequest}
            />
        </>
    );
};

export default LeaveHistoryTable;
