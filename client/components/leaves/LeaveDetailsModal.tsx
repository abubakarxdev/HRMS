import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Calendar, User, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import Button from '../ui/Button';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';

interface LeaveDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: any;
    onApprove?: (id: string, comment: string) => void;
    onReject?: (id: string, comment: string) => void;
}

const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({ isOpen, onClose, request, onApprove, onReject }) => {
    const [comment, setComment] = useState('');

    const { user } = useAuth();
    const isSelfRequest = user?.employeeId === request?.employeeId;

    if (!request) return null;

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return <CheckCircle className="w-5 h-5 mr-2" />;
            case 'rejected': return <XCircle className="w-5 h-5 mr-2" />;
            default: return <Clock className="w-5 h-5 mr-2" />;
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
                    <div className="flex justify-between items-center p-6 border-b border-slate-100">
                        <Dialog.Title className="text-xl font-bold text-slate-800">Leave Request Details</Dialog.Title>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Header Info */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                    {request.employee?.firstName?.[0]}{request.employee?.lastName?.[0]}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        {request.employee?.firstName} {request.employee?.lastName}
                                    </h3>
                                    <p className="text-sm text-slate-500">{request.employee?.employeeIdNumber}</p>
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-full border flex items-center ${getStatusColor(request.status)}`}>
                                {getStatusIcon(request.status)}
                                <span className="font-medium capitalize">{request.status}</span>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Type</span>
                                <div className="flex items-center text-slate-800 font-medium">
                                    <div className={`w-3 h-3 rounded-full mr-2 ${
                                        request.leaveType === 'Sick' ? 'bg-red-500' : 
                                        request.leaveType === 'Annual' ? 'bg-blue-500' : 'bg-yellow-500'
                                    }`}></div>
                                    {request.leaveType}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</span>
                                <div className="flex items-center text-slate-800 font-medium">
                                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                    {dayjs(request.startDate).format('MMM D, YYYY')} - {dayjs(request.endDate).format('MMM D, YYYY')}
                                </div>
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-slate-700 flex items-center">
                                <FileText className="w-4 h-4 mr-2" />
                                Reason for Leave
                            </h4>
                            <p className="text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm leading-relaxed">
                                {request.reason}
                            </p>
                        </div>

                        {/* HR Comments Section */}
                        {request.status === 'Pending' && onApprove && onReject ? (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Add Comments (Optional)</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none"
                                    rows={3}
                                    placeholder="Enter any comments regarding approval or rejection..."
                                />
                            </div>
                        ) : request.approverComments && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-slate-700">Approver Comments</h4>
                                <p className="text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm italic">
                                    "{request.approverComments}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Actions Footer */}
                    {request.status === 'Pending' && onApprove && onReject && !isSelfRequest && (
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button 
                                variant="danger" 
                                onClick={() => onReject(request.id, comment)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Reject Request
                            </Button>
                            <Button 
                                onClick={() => onApprove(request.id, comment)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                Approve Request
                            </Button>
                        </div>
                    )}
                    
                    {/* Close button for View Only mode */}
                    {(!onApprove || !onReject || request.status !== 'Pending' || isSelfRequest) && (
                         <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    )}
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default LeaveDetailsModal;
