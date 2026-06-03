import React from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

/** Animated toast notification that slides in from the bottom-right */
export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';
  
  let bgColor = 'bg-emerald-500';
  let Icon = CheckCircle2;
  
  if (isError) {
    bgColor = 'bg-red-500';
    Icon = XCircle;
  } else if (isInfo) {
    bgColor = 'bg-blue-500';
    Icon = Info;
  }

  return (
    <div
      className={`
        fixed bottom-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5
        rounded-xl shadow-2xl text-white text-sm font-medium
        transform transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in
        ${bgColor}
      `}
    >
      <Icon size={18} className="shrink-0" />
      <span className="flex-1 mr-2">{toast.message}</span>
      {onClose && (
        <button 
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0"
          aria-label="Close message"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
