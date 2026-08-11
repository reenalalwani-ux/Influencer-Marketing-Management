import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  maxWidth = 'max-w-md',
  children
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Box */}
      <div className={`relative z-10 bg-white border border-slate-200 rounded-3xl w-full ${maxWidth} max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-slate-900`}>
        {/* Pinned Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition font-bold text-lg px-2.5 py-1 rounded-xl hover:bg-slate-100"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm flex-1 text-slate-800">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
