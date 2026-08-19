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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post(`/tasks/${task._id}/submit-url`, { publishedUrl });
      if (res.success) {
        onSuccess(task._id as string, publishedUrl);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit URL');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={!!task}
      onClose={onClose}
      title="Submit Published Content URL"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Social Media Published URL
            </label>
            <input
              type="url"
              required
              value={publishedUrl}
              onChange={(e) => setPublishedUrl(e.target.value)}
              placeholder="https://instagram.com/p/..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 transition font-medium"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
              Important: Do not upload video/image files directly. Store only the social media URL.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 btn-gradient-primary text-white rounded-xl font-bold text-xs transition shadow-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Submit URL</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
