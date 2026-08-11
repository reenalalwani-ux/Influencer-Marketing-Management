import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, ExternalLink, ShieldCheck, Clock, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { TaskItem } from '../types';
import { Modal } from '../components/Modal';

export const VerificationQueueView: React.FC = () => {
  const [pendingTasks, setPendingTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [comments, setComments] = useState('');

  const fetchPending = async () => {
    try {
      const res = await api.get('/verification/pending');
      if (res.success) setPendingTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerifyDecision = async (decision: 'Verified' | 'Rejected') => {
    if (!selectedTask) return;
    if (decision === 'Rejected' && !rejectionReason) {
      alert('Please specify a rejection reason.');
      return;
    }

    try {
      const res = await api.post(`/verification/${selectedTask._id}/verify`, {
        decision,
        rejectionReason,
        comments
      });

      if (res.success) {
        setSelectedTask(null);
        setRejectionReason('');
        setComments('');
        fetchPending();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete verification');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="text-emerald-600" />
            Manager Verification Queue
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-1">Review and verify submitted social media URLs from employees</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500 font-medium">Loading pending verifications...</div>
      ) : (
        <div className="space-y-4">
          {pendingTasks.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 shadow-xs">
              <CheckCircle2 size={40} className="mx-auto text-emerald-600 mb-2" />
              <h3 className="font-extrabold text-slate-900 text-lg">No Pending Verifications</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">All employee published URL submissions have been verified!</p>
            </div>
          ) : (
            pendingTasks.map((t) => {
              const emp = t.employeeId as any;
              const brand = t.brandId as any;
              return (
                <div key={t._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold badge-pending">
                        Pending Manager Verification
                      </span>
                      <span className="text-xs font-bold text-purple-700 font-mono">Task #{t.taskId}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{t.title}</h3>

                    <div className="text-xs text-slate-600 space-x-3">
                      <span>Submitted by: <strong className="text-slate-900">{emp?.name || 'Employee'}</strong></span>
                      <span>• Brand: <strong className="text-purple-700">{brand?.brandName || 'Brand'}</strong></span>
                    </div>

                    <div className="pt-2">
                      <a
                        href={t.publishedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs text-purple-700 hover:text-purple-900 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 font-mono font-bold"
                      >
                        <ExternalLink size={13} />
                        <span>{t.publishedUrl}</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end md:self-center">
                    <button
                      onClick={() => setSelectedTask(t)}
                      className="px-4 py-2 btn-gradient-primary rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5"
                    >
                      <CheckCircle2 size={14} />
                      <span>Review & Verify</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Verify Task Submission"
      >
        {selectedTask && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Task #{selectedTask.taskId} • {selectedTask.title}</p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-300">
              <div>URL: <a href={selectedTask.publishedUrl} target="_blank" rel="noreferrer" className="text-blue-400 font-medium hover:underline">{selectedTask.publishedUrl}</a></div>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Rejection Reason (If Rejecting)</label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incorrect brand tag or broken link"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Comments (Optional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Manager review notes..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-100 h-16 focus:outline-none text-xs"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyDecision('Rejected')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-xs transition"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyDecision('Verified')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs shadow-lg shadow-emerald-600/30 transition"
                >
                  Approve & Verify
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
