import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, CheckCircle2, Shield } from 'lucide-react';
import { User as UserType, NotificationItem } from '../types';
import { api } from '../services/api';

interface NavbarProps {
  user: UserType | null;
  onLogout: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, activeView, setActiveView }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl sticky top-0 z-20 px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-purple-500/25">
          IM
        </div>
        <div>
          <h1 className="font-extrabold text-slate-900 text-lg leading-none tracking-tight">
            Influencer Operations
          </h1>
          <p className="text-[11px] text-purple-600 font-bold mt-0.5 tracking-wide">Enterprise Work Management System v1.0</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:text-purple-700 hover:bg-purple-50 border border-slate-200 transition relative"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-black text-xs rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-slate-200 text-sm z-50 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <span className="font-extrabold text-slate-900">Notifications ({unreadCount} unread)</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-purple-700 hover:text-purple-900 font-extrabold flex items-center gap-1"
                  >
                    <CheckCircle2 size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {notifications.length === 0 ? (
                  <p className="text-center text-slate-500 py-4 text-xs font-medium">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 rounded-xl border text-xs ${!n.read ? 'bg-purple-50/60 border-purple-200 text-slate-900 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                    >
                      <div className="font-bold text-slate-900">{n.title}</div>
                      <p className="mt-1 leading-relaxed text-slate-700 font-medium">{n.message}</p>
                      <span className="text-[10px] text-slate-500 font-bold mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Role Badge */}
        {user && (
          <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
              {user.name.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-extrabold text-slate-900 leading-none">{user.name}</div>
              <div className="flex items-center gap-1 mt-1">
                <Shield size={10} className="text-purple-600" />
                <span className="text-[11px] text-purple-700 font-extrabold">{user.role}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition font-bold"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
