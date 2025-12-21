import React from 'react';
import Button from './Button';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading = false,
}) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                        {title}
                    </h3>
                    <div className="mt-2">
                        <p className="text-sm text-slate-500">
                            {message}
                        </p>
                    </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                    <Button
                        variant="danger"
                        onClick={onConfirm}
                        isLoading={isLoading}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="mt-3 sm:mt-0 w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
