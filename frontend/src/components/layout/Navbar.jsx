import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSubject } from '../../context/SubjectContext';
import { BookOpen, LogOut, User as UserIcon, PlusCircle, CheckCircle, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export function Navbar() {
  const { user, logout } = useAuth();
  const { subjects, selectedSubjectId, selectSubject, selectedSubject } = useSubject();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-indigo-600">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            StudyBuddy
          </span>
        </Link>

        {/* Global Active Subject Selector */}
        <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Subject:
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedSubjectId}
              onChange={(e) => selectSubject(e.target.value)}
              className="text-sm font-medium bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {subjects.length === 0 ? (
                <option value="">No subjects created</option>
              ) : (
                subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))
              )}
            </select>

            <Link
              to="/subjects/new"
              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
              title="Add Subject"
            >
              <PlusCircle className="w-4 h-4" />
            </Link>

            {selectedSubject && (
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  selectedSubject.topics_status === 'ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : selectedSubject.topics_status === 'failed'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {selectedSubject.topics_status === 'ready' ? (
                  <>
                    <CheckCircle className="w-3 h-3" /> Syllabus Ready
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 animate-spin" /> Parsing Syllabus
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-700">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-sm">
            {user?.email?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
          </div>
          <span className="text-sm font-medium hidden sm:inline">{user?.email}</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-rose-600 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

