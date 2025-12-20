import React, { useState } from 'react';
import dayjs from 'dayjs';
import LeaveDetailsModal from './LeaveDetailsModal';
import Button from '../ui/Button';
import { Eye, Calendar, FileText } from 'lucide-react';
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
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    return (
        <>
            <div className="overflow-x-auto min-h-[300px]">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider pl-8">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Applied On</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider pr-8">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {loading ? (
                             <tr>
                                <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                                        <p className="text-sm font-medium text-slate-600">Loading history...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : requests.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                                    <FileText className="mx-auto mb-3 text-slate-300" size={40} />
                                    <p className="font-medium text-slate-600">No leave requests found</p>
                                </td>
                            </tr>
                        ) : (
                            requests.map((request) => (
                                <tr key={request.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 pl-8 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                                <Calendar size={16} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{request.leaveType}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-900">
                                                {dayjs(request.startDate).format('MMM D, YYYY')}
                                            </span>
                                            {dayjs(request.startDate).isSame(request.endDate) ? (
                                                <span className="text-xs text-slate-400">1 Day</span>
                                            ) : (
                                                <span className="text-xs text-slate-400">
                                                    Until {dayjs(request.endDate).format('MMM D')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <p className="text-sm text-slate-600 truncate" title={request.reason}>
                                            {request.reason}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {dayjs(request.createdAt).format('MMM D, YYYY')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm ${getStatusColor(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right pr-8">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetails(request);
                                            }}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-xs font-bold shadow-sm shadow-indigo-200"
                                            title="View Details"
                                        >
                                            <Eye size={14} />
                                            View
                                        </button>
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
