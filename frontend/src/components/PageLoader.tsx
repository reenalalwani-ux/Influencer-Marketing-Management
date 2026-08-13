import React from 'react';

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 animate-fade-in">
      {/* Spinner */}
      <div className="relative w-14 h-14">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
        {/* Spinning arc */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 border-r-indigo-500 animate-spin" />
        {/* Inner pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-purple-600 animate-pulse" />
        </div>
      </div>

      {/* Skeleton shimmer bars */}
      <div className="w-72 space-y-2.5">
        <div className="h-3 rounded-full bg-slate-200 animate-pulse w-full" />
        <div className="h-3 rounded-full bg-slate-100 animate-pulse w-4/5 mx-auto" />
        <div className="h-3 rounded-full bg-slate-200 animate-pulse w-3/5 mx-auto" />
      </div>

      {/* Message */}
      <p className="text-sm font-semibold text-slate-400 tracking-wide">{message}</p>
    </div>
  );
};

/** Inline mini loader for use inside cards/tables */
export const InlineLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center gap-3 py-8 text-slate-400">
    <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
    <span className="text-sm font-semibold">{message}</span>
  </div>
);
