import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, User, Sparkles, KeyRound, CheckCircle2, RotateCcw, ArrowLeft, Lock } from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserType, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');

  // Sign In State
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('Influencer Marketing');
  const [signupDesignation, setSignupDesignation] = useState('Influencer Executive');
  const [signupRole, setSignupRole] = useState('Employee');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Request OTP from Email Address
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.toLowerCase().trim().endsWith('@ad2ship.com')) {
      setError('Access Restricted: Email address must end with @ad2ship.com company domain.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/request-otp', { email: email.toLowerCase().trim() });
      if (res.success) {
        setSuccessMessage(`Security OTP sent to ${res.email}`);
        setStep('otp');
        setResendTimer(30);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and complete login
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the full 6-digit OTP code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/verify-otp', { email: email.toLowerCase().trim(), otpCode });
      if (res.success) {
        localStorage.setItem('token', res.token);
        onLoginSuccess(res.user, res.token);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    if (!email.toLowerCase().trim().endsWith('@ad2ship.com')) {
      setError('Access Restricted: Email address must end with @ad2ship.com company domain.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await api.post('/auth/request-otp', { email: email.toLowerCase().trim() });
      if (res.success) {
        setSuccessMessage(`New OTP code sent to ${email}`);
        setResendTimer(30);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // Create New Account
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!signupEmail.toLowerCase().trim().endsWith('@ad2ship.com')) {
      setError('Registration Restricted: Only @ad2ship.com company email addresses can register.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/signup', {
        name: signupName,
        email: signupEmail.toLowerCase().trim(),
        password: signupPassword,
        phone: signupPhone,
        department: signupDepartment,
        designation: signupDesignation,
        role: signupRole
      });

      if (res.success) {
        localStorage.setItem('token', res.token);
        onLoginSuccess(res.user, res.token);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100/70 via-slate-50 to-pink-100/70 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Dynamic ambient lights */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-300/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-200/80 relative z-10 animate-fade-in space-y-6">
        {/* Header Branding */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg shadow-purple-600/30 mb-3.5 tracking-wider">
            IM
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Influencer Marketing Operation</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Enterprise Passwordless OTP Email Login</p>
        </div>

        {/* Tab Switcher */}
        {step === 'credentials' && (
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex text-xs font-extrabold">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setError(''); setSuccessMessage(''); }}
              className={`flex-1 py-2.5 rounded-xl transition text-center ${
                activeTab === 'signin'
                  ? 'bg-white text-purple-700 shadow-xs border border-slate-200/60 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setError(''); setSuccessMessage(''); }}
              className={`flex-1 py-2.5 rounded-xl transition text-center ${
                activeTab === 'signup'
                  ? 'bg-white text-purple-700 shadow-xs border border-slate-200/60 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-fade-in flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-fade-in flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: WORK EMAIL ADDRESS INPUT */}
        {activeTab === 'signin' && step === 'credentials' && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-3.5 text-purple-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gunjan@ad2ship.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 transition font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 btn-gradient-primary text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Sending OTP to Email...' : 'Send Email OTP'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION INPUT */}
        {activeTab === 'signin' && step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4 animate-fade-in">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-center text-xs space-y-1">
              <div className="text-slate-500 font-medium">OTP code sent to:</div>
              <div className="font-extrabold text-purple-800 text-sm">{email}</div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 text-center">
                Enter 6-Digit Email Verification Code
              </label>
              <div className="relative">
                <KeyRound size={20} className="absolute left-3.5 top-3 text-purple-600" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-center text-2xl font-mono font-black tracking-widest text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 transition"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 btn-gradient-primary text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
            >
              <span>{loading ? 'Verifying Code...' : 'Verify OTP & Login'}</span>
              <CheckCircle2 size={18} />
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => { setStep('credentials'); setOtpCode(''); setError(''); setSuccessMessage(''); }}
                className="text-slate-600 hover:text-purple-700 font-bold flex items-center gap-1"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendTimer > 0 || loading}
                className="text-purple-700 hover:text-purple-900 font-extrabold disabled:opacity-50 flex items-center gap-1"
              >
                <RotateCcw size={13} />
                <span>{resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend OTP'}</span>
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3.5 text-sm animate-fade-in">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-purple-600" />
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Radhika Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Work Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-purple-600" />
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="radhika@ad2ship.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-purple-600" />
                <input
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={signupDepartment}
                  onChange={(e) => setSignupDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-medium"
                >
                  <option value="Influencer Marketing">Influencer Marketing</option>
                  <option value="Content Creation">Content Creation</option>
                  <option value="Campaign Strategy">Campaign Strategy</option>
                  <option value="Quality Control">Quality Control</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-medium"
                >
                  <option value="Employee">Employee</option>
                  <option value="Marketing Manager">Manager</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Designation
              </label>
              <input
                type="text"
                required
                value={signupDesignation}
                onChange={(e) => setSignupDesignation(e.target.value)}
                placeholder="e.g. Content Lead"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 btn-gradient-primary text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-xs disabled:opacity-50 mt-3"
            >
              <Sparkles size={16} />
              <span>{loading ? 'Registering...' : 'Create Account & Login'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
