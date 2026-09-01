import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, User, Sparkles, KeyRound, CheckCircle2, RotateCcw, ArrowLeft, Lock, Phone, Briefcase, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserType, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [loginType, setLoginType] = useState<'employee' | 'client'>('employee');
  const [step, setStep] = useState<'credentials' | 'otp' | 'pending_approval'>('credentials');

  // Sign In State
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('Influencer Marketing');
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const deptRef = React.useRef<HTMLDivElement>(null);

  const deptOptions = [
    'Influencer Marketing',
    'Content Creation',
    'Campaign Strategy',
    'Quality Control',
    'Management'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) {
        setIsDeptOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [signupOtpCode, setSignupOtpCode] = useState('');
  const [signupStep, setSignupStep] = useState<'form' | 'otp' | 'pending_approval'>('form');

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

  // Request OTP for Login
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const formattedEmail = email.toLowerCase().trim();

    if (loginType === 'employee' && !formattedEmail.endsWith('@ad2ship.com')) {
      setError('Access Restricted: Employee email address must end with @ad2ship.com company domain.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/request-otp', { email: formattedEmail, loginType });
      if (res.success) {
        setOtpCode('');
        setSuccessMessage(`Security OTP sent to ${res.email}. Please check your email inbox.`);
        setStep('otp');
        setResendTimer(30);
      }
    } catch (err: any) {
      if (err.status === 'Pending Approval') {
        setStep('pending_approval');
      } else if (err.status === 'Pending Verification') {
        // User signed up but didn't verify OTP — switch to signup tab, otp step
        setActiveTab('signup');
        setSignupEmail(email);
        setSignupStep('otp');
        setError('Please complete your email verification first. Enter the OTP sent to your inbox during sign-up, or re-register to get a new OTP.');
      } else {
        setError(err.message || 'Failed to send OTP. Please check your email address.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and complete Login
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
        onLoginSuccess(res.user, '');
      }
    } catch (err: any) {
      if (err.status === 'Pending Approval' || (err.message && err.message.includes('awaiting Manager approval'))) {
        setStep('pending_approval');
      } else {
        setError(err.message || 'Invalid or expired OTP code');
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP for Sign-In
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    const formattedEmail = email.toLowerCase().trim();
    if (loginType === 'employee' && !formattedEmail.endsWith('@ad2ship.com')) {
      setError('Access Restricted: Employee email address must end with @ad2ship.com company domain.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await api.post('/auth/request-otp', { email: formattedEmail, loginType });
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

  // Request Sign-Up OTP (No Role & Password fields)
  const handleSignupRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!signupName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!signupEmail.toLowerCase().trim().endsWith('@ad2ship.com')) {
      setError('Registration Restricted: Only @ad2ship.com company email addresses can register.');
      return;
    }

    if (!signupPhone.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/signup', {
        name: signupName.trim(),
        email: signupEmail.toLowerCase().trim(),
        phone: signupPhone.trim(),
        department: signupDepartment
      });

      if (res.success) {
        if (res.status === 'Pending Approval') {
          setSignupStep('pending_approval');
        } else {
          setSuccessMessage(`Verification OTP sent to ${signupEmail}. Enter OTP code below.`);
          setSignupStep('otp');
          setResendTimer(30);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  // Verify Sign-Up OTP (Submits to Manager for Approval)
  const handleVerifySignupOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupOtpCode || signupOtpCode.length < 6) {
      setError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/verify-signup-otp', {
        email: signupEmail.toLowerCase().trim(),
        otpCode: signupOtpCode
      });

      if (res.success) {
        setSignupStep('pending_approval');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please try again.');
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

      <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(124,58,237,0.15)] border border-slate-200/90 relative z-10 animate-fade-in space-y-6">
        {/* Header Branding */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="Ad2media Logo"
              className="h-12 sm:h-14 w-auto max-w-[220px] object-contain drop-shadow-sm"
            />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AD2media</h1>
          <p className="text-xs font-bold text-slate-500 mt-1">Enterprise Passwordless Email Verification & Manager Approval</p>
        </div>

        {/* Tab Switcher */}
        {step === 'credentials' && signupStep === 'form' && (
          <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 flex text-xs font-black shadow-inner">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setError(''); setSuccessMessage(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${activeTab === 'signin'
                  ? 'bg-white text-purple-700 shadow-sm border border-slate-200/80 font-black'
                  : 'text-slate-500 hover:text-slate-900 font-extrabold'
                }`}
            >
              <KeyRound size={15} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setError(''); setSuccessMessage(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${activeTab === 'signup'
                  ? 'bg-white text-purple-700 shadow-sm border border-slate-200/80 font-black'
                  : 'text-slate-500 hover:text-slate-900 font-extrabold'
                }`}
            >
              <Sparkles size={15} />
              <span>Create Account</span>
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold animate-fade-in flex items-center gap-2 shadow-xs">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold animate-fade-in flex items-center gap-2 shadow-xs">
            <span>{error}</span>
          </div>
        )}

        {/* PENDING MANAGER APPROVAL VIEW (FOR BOTH SIGNIN & SIGNUP) */}
        {(step === 'pending_approval' || (activeTab === 'signup' && signupStep === 'pending_approval')) && (
          <div className="p-6 bg-purple-50/80 border border-purple-200/80 rounded-3xl text-center space-y-4 animate-fade-in shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md ring-4 ring-purple-100">
              <Sparkles size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Email Address Verified!</h3>
              <p className="text-xs font-extrabold text-purple-800 uppercase tracking-wider">Awaiting Manager Approval</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Your registration request has been submitted to your Manager. Once a Manager approves your account, you will receive full access to the Dashboard and system modules.
            </p>
            <div className="pt-2 border-t border-purple-200/60 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setSignupStep('form');
                  setActiveTab('signin');
                  setError('');
                  setSuccessMessage('');
                }}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-xs shadow-md transition"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: SIGN IN EMAIL ADDRESS INPUT */}
        {activeTab === 'signin' && step === 'credentials' && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            {/* Login Type Selector (Employee vs Client) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setLoginType('employee'); setError(''); }}
                className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  loginType === 'employee'
                    ? 'bg-purple-600 text-white shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
              >
                <User size={14} />
                <span>Team Login</span>
              </button>
              <button
                type="button"
                onClick={() => { setLoginType('client'); setError(''); }}
                className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  loginType === 'client'
                    ? 'bg-purple-600 text-white shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
              >
                <Briefcase size={14} />
                <span>Client Portal</span>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  {loginType === 'employee' ? 'Team Email Address' : 'Client Account Email'}
                </label>
                <span className="text-[10px] font-bold text-purple-600">
                  {loginType === 'employee' ? '@ad2ship.com domain required' : 'Any registered client email'}
                </span>
              </div>
              <div className="relative flex items-center">
                <Mail size={18} className="absolute left-3.5 text-purple-600 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={loginType === 'employee' ? 'user@ad2ship.com' : 'client@brand.com'}
                  className="w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all rounded-xl pl-10 pr-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 font-semibold shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold rounded-xl shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center space-x-2 text-xs disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Sending OTP to Email...' : (loginType === 'client' ? 'Access Client Portal' : 'Send Email OTP')}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: SIGN IN OTP VERIFICATION INPUT */}
        {activeTab === 'signin' && step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4 animate-fade-in">
            <div className="p-4 bg-purple-50/80 border border-purple-200/80 rounded-2xl text-center text-xs space-y-1">
              <div className="text-slate-500 font-medium">OTP code sent to:</div>
              <div className="font-black text-purple-800 text-sm">{email}</div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 text-center">
                Enter 6-Digit Email Verification Code
              </label>
              <div className="relative">
                <KeyRound size={20} className="absolute left-3.5 top-3.5 text-purple-600" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full bg-slate-50/80 focus:bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-center text-2xl font-mono font-black tracking-widest text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all shadow-2xs"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold rounded-xl shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center space-x-2 text-xs disabled:opacity-50"
            >
              <span>{loading ? 'Verifying Code...' : 'Verify OTP & Login'}</span>
              <CheckCircle2 size={18} />
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => { setStep('credentials'); setOtpCode(''); setError(''); setSuccessMessage(''); }}
                className="text-slate-600 hover:text-purple-700 font-extrabold flex items-center gap-1"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendTimer > 0 || loading}
                className="text-purple-700 hover:text-purple-900 font-black disabled:opacity-50 flex items-center gap-1"
              >
                <RotateCcw size={13} />
                <span>{resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend OTP'}</span>
              </button>
            </div>
          </form>
        )}

        {/* PASSWORDLESS SIGN UP FORM (NO ROLE, NO PASSWORD) */}
        {activeTab === 'signup' && signupStep === 'form' && (
          <form onSubmit={handleSignupRequest} className="space-y-4 text-sm animate-fade-in">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User size={18} className="absolute left-3.5 text-purple-600 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 font-semibold shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Work Email (@ad2ship.com)
              </label>
              <div className="relative flex items-center">
                <Mail size={18} className="absolute left-3.5 text-purple-600 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 font-semibold shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative flex items-center">
                  <Phone size={18} className="absolute left-3.5 text-purple-600 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 font-semibold shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <div className="relative" ref={deptRef}>
                  <button
                    type="button"
                    onClick={() => setIsDeptOpen(!isDeptOpen)}
                    className="w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-900 font-semibold flex items-center justify-between shadow-2xs cursor-pointer text-left"
                  >
                    <Briefcase size={18} className="absolute left-3.5 text-purple-600 pointer-events-none" />
                    <span className="truncate">{signupDepartment}</span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 pointer-events-none transition-transform duration-200 shrink-0 ${isDeptOpen ? 'rotate-180 text-purple-600' : ''
                        }`}
                    />
                  </button>

                  {isDeptOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-purple-900/10 z-50 py-1.5 overflow-hidden animate-fade-in space-y-0.5">
                      {deptOptions.map((dept) => {
                        const isSelected = signupDepartment === dept;
                        return (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => {
                              setSignupDepartment(dept);
                              setIsDeptOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${isSelected
                                ? 'bg-purple-50 text-purple-700 font-extrabold'
                                : 'text-slate-700 hover:bg-purple-50/60 hover:text-purple-600'
                              }`}
                          >
                            <span>{dept}</span>
                            {isSelected && <CheckCircle2 size={14} className="text-purple-600 shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold rounded-xl shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center space-x-2 text-xs disabled:opacity-50 mt-3"
            >
              <Sparkles size={16} />
              <span>{loading ? 'Sending Verification OTP...' : 'Send Verification OTP'}</span>
            </button>
          </form>
        )}

        {/* SIGN UP OTP VERIFICATION STEP */}
        {activeTab === 'signup' && signupStep === 'otp' && (
          <form onSubmit={handleVerifySignupOTP} className="space-y-4 animate-fade-in">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-center text-xs space-y-1">
              <div className="text-slate-500 font-medium">Verification OTP sent to:</div>
              <div className="font-extrabold text-purple-800 text-sm">{signupEmail}</div>
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
                  value={signupOtpCode}
                  onChange={(e) => setSignupOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
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
              <span>{loading ? 'Verifying OTP...' : 'Verify OTP & Submit Request'}</span>
              <CheckCircle2 size={18} />
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => { setSignupStep('form'); setSignupOtpCode(''); setError(''); setSuccessMessage(''); }}
                className="text-slate-600 hover:text-purple-700 font-bold flex items-center gap-1"
              >
                <ArrowLeft size={14} /> Edit Details
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
