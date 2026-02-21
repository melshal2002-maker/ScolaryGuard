
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
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-sm font-medium text-blue-600">Detector</a>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900">Humanizer</a>
          </nav>
          <div className="flex items-center space-x-4">
            <button className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
