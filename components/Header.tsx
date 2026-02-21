
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <i className="fas fa-scroll text-white text-xl"></i>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">ScholarGuard</span>
          </div>
          <nav className="flex space-x-8">
            <a href="#" className="text-sm font-medium text-blue-600">Detector</a>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900">Humanizer</a>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900">API Docs</a>
          </nav>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Unrestricted Access</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
