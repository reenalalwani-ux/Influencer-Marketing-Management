import React, { useState } from 'react';
import { Link2, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { TaskItem } from '../types';
import { Modal } from './Modal';

interface URLSubmissionModalProps {
  task: TaskItem | null;
  onClose: () => void;
  onSuccess: (taskId: string, publishedUrl: string) => void;
}

export const URLSubmissionModal: React.FC<URLSubmissionModalProps> = ({ task, onClose, onSuccess }) => {
  const [publishedUrl, setPublishedUrl] = useState(task?.publishedUrl || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (task) {
      setPublishedUrl(task.publishedUrl || '');
      setError('');
    }
  }, [task]);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent, completeWithoutUrl = false) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const urlValue = completeWithoutUrl ? '' : publishedUrl.trim();

    try {
      const res = await api.post(`/tasks/${task._id}/submit-url`, { 
        publishedUrl: urlValue,
        status: 'Verified'
      });
      if (res.success) {
        onSuccess(task._id as string, urlValue);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={!!task}
      onClose={onClose}
      title="Complete Task / Submit Content URL"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 font-semibold -mt-2">
          Task #{task.taskId} • {task.title}
        </p>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
          <div>Platform: <strong className="text-purple-700">{task.platform}</strong></div>
          <div>Content Type: <strong className="text-slate-900">{task.contentType}</strong></div>
          <div>Scheduled Date: <strong className="text-slate-900">{new Date(task.scheduledDate).toLocaleDateString()}</strong></div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Social Media Published URL <span className="text-slate-400 font-normal normal-case">(Optional)</span>
              </label>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                Optional
              </span>
            </div>
            <input
              type="url"
              value={publishedUrl}
              onChange={(e) => setPublishedUrl(e.target.value)}
              placeholder="e.g. https://instagram.com/p/... (Optional)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 transition font-medium"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
              You can paste the live social media link, or mark the task as complete directly without a URL.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={(e) => handleSubmit(e, true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              <span>Mark Complete</span>
            </button>
            {publishedUrl.trim() && (
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 btn-gradient-primary text-white rounded-xl font-bold text-xs transition shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Submit with URL</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
};
