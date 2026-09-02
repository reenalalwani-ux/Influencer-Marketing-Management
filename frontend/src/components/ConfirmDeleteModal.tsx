import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  itemType?: string;
  warningMessage?: string;
  loading?: boolean;
  confirmButtonText?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Delete',
  itemName,
  itemType = 'record',
  warningMessage,
  loading = false,
  confirmButtonText = 'Yes, Delete'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title={title}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="flex items-start space-x-3.5 p-4 bg-rose-50/80 border border-rose-100 rounded-2xl">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <AlertTriangle size={20} className="text-rose-600" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-900 text-sm">Are you sure you want to proceed?</h4>
            <p className="text-slate-600 font-medium leading-relaxed">
              Do you really want to delete this {itemType}
              {itemName ? (
                <>: <strong className="text-slate-900 font-bold">"{itemName}"</strong>?</>
              ) : (
                '?'
              )}
            </p>
          </div>
        </div>

        {warningMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 font-semibold text-[11px] flex items-center gap-2">
            <span>⚠️</span>
            <span>{warningMessage}</span>
          </div>
        )}

        <div className="flex justify-end items-center space-x-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs border border-slate-200 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl font-bold transition text-xs shadow-md shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>{confirmButtonText}</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
