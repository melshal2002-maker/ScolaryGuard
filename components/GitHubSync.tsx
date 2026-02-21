import React, { useState, useEffect } from 'react';
import { GitHubRepo, GitHubUser } from '../types';

interface Props {
  content: string;
  defaultFileName: string;
  title: string;
}

const GitHubSync: React.FC<Props> = ({ content, defaultFileName, title }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [fileName, setFileName] = useState(defaultFileName);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        checkAuthStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/github/status');
      const data = await res.json();
      setIsAuthenticated(data.isAuthenticated);
      if (data.isAuthenticated) {
        fetchUserData();
        fetchRepos();
      }
    } catch (err) {
      console.error('Auth status check failed', err);
    }
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/github/user');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error('Failed to fetch user data', err);
    }
  };

  const fetchRepos = async () => {
    try {
      const res = await fetch('/api/github/repos');
      if (res.ok) {
        const data = await res.json();
        setRepos(data);
      }
    } catch (err) {
      console.error('Failed to fetch repos', err);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/auth/github/url');
      const { url } = await res.json();
      window.open(url, 'github_oauth', 'width=600,height=700');
    } catch (err) {
      console.error('Failed to get auth URL', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/github/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setUser(null);
    setRepos([]);
  };

  const handleSync = async () => {
    if (!selectedRepo || !fileName) return;
    
    setIsSyncing(true);
    setStatus(null);
    
    const [owner, repo] = selectedRepo.split('/');
    
    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          path: fileName,
          content,
          message: `ScholarGuard Sync: ${title}`,
        }),
      });
      
      if (res.ok) {
        setStatus({ type: 'success', message: 'Successfully synced to GitHub!' });
        setTimeout(() => setShowModal(false), 2000);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.message || 'Sync failed' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error during sync' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
      >
        <i className="fab fa-github text-sm"></i>
        Sync to GitHub
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                  <i className="fab fa-github text-white"></i>
                </div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">GitHub Repository Sync</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-8 space-y-6">
              {!isAuthenticated ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <i className="fab fa-github text-3xl text-slate-300"></i>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Connect your GitHub account to save your scholarly analysis and humanized content directly to your repositories.
                  </p>
                  <button 
                    onClick={handleConnect}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                  >
                    Connect GitHub Account
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {user && (
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar_url} alt={user.login} className="w-8 h-8 rounded-full border border-slate-200" />
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{user.login}</span>
                      </div>
                      <button onClick={handleLogout} className="text-[8px] font-black text-rose-500 uppercase tracking-widest hover:underline">
                        Disconnect
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Repository</label>
                      <select 
                        value={selectedRepo}
                        onChange={(e) => setSelectedRepo(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                      >
                        <option value="">Choose a repository...</option>
                        {repos.map(repo => (
                          <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">File Name</label>
                      <input 
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="e.g., summary.md"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                      />
                    </div>
                  </div>

                  {status && (
                    <div className={`p-4 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 ${
                      status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      <i className={`fas ${status.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                      {status.message}
                    </div>
                  )}

                  <button 
                    onClick={handleSync}
                    disabled={isSyncing || !selectedRepo || !fileName}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    {isSyncing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                    {isSyncing ? 'Syncing...' : 'Push to Repository'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GitHubSync;
