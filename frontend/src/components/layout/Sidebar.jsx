import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookMarked,
  Sparkles,
  HelpCircle,
  MessageSquare,
  CalendarDays,
  FileCheck2,
} from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/subjects', label: 'Subjects & Files', icon: BookMarked },
    { to: '/learn', label: 'Learn & Flashcards', icon: Sparkles },
    { to: '/recall', label: 'Recall & Quizzes', icon: HelpCircle },
    { to: '/chat', label: 'AI Study Chat', icon: MessageSquare },
    { to: '/planner', label: 'Study Planner', icon: CalendarDays },
    { to: '/resume', label: 'Resume ATS Analysis', icon: FileCheck2 },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1 flex flex-col gap-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Study Workflows
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="bg-indigo-600/5 border border-indigo-100 rounded-xl p-3">
          <p className="text-xs font-semibold text-indigo-900">RAG & Local AI</p>
          <p className="text-xs text-indigo-700/80 mt-0.5">
            Grounded directly from your lecture notes & syllabus.
          </p>
        </div>
      </div>
    </aside>
  );
}

