import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    const Icon = type === 'success' ? CheckCircle : AlertCircle;

    return (
        <div className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 min-w-[300px] max-w-[500px] animate-slide-up`}>
            <Icon size={20} className="flex-shrink-0" />
            <span className="flex-1">{message}</span>
            <button
                onClick={onClose}
                className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
                aria-label="Close"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
