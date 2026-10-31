import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubject } from '../context/SubjectContext';
import {
  BookOpen,
  Sparkles,
  HelpCircle,
  MessageSquare,
  Calendar,
  FileText,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  Layers,
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const { subjects, selectedSubject, selectSubject } = useSubject();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Welcome back, {user?.name || user?.email?.split('@')[0]}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Ready to study smart today?
          </h1>
          <p className="text-indigo-100 mt-1 max-w-xl text-sm md:text-base">
            {selectedSubject
              ? `Currently studying ${selectedSubject.name}. Generate quizzes, dive into tricky topics, or ask questions directly from your materials.`
              : 'Add your first subject syllabus to unlock AI study plans, flashcards, and RAG search.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/learn"
            className="px-4 py-2.5 bg-white text-indigo-700 font-semibold rounded-xl text-sm shadow hover:bg-indigo-50 transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Quick Study
          </Link>
          <Link
            to="/chat"
            className="px-4 py-2.5 bg-indigo-500/30 text-white font-semibold rounded-xl text-sm hover:bg-indigo-500/40 backdrop-blur-sm transition flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Ask Tutor
          </Link>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/learn"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">Deep Dive & Cards</h3>
          <p className="text-xs text-slate-500 mt-1">
            Intuitive breakdowns, worked examples, and interactive flashcard decks.
          </p>
        </Link>

        <Link
          to="/recall"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">Active Recall</h3>
          <p className="text-xs text-slate-500 mt-1">
            Test yourself with MCQs or voice/text open questions with AI rubric grading.
          </p>
        </Link>

        <Link
          to="/planner"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">Exam Planner</h3>
          <p className="text-xs text-slate-500 mt-1">
            AI-weighted schedule spaced until your exam with .ics calendar export.
          </p>
        </Link>

        <Link
          to="/resume"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">Resume ATS & Gaps</h3>
          <p className="text-xs text-slate-500 mt-1">
            Compare your resume skills against course syllabus or job descriptions.
          </p>
        </Link>
      </div>

      {/* Subjects Overview Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Enrolled Subjects</h2>
            <p className="text-xs text-slate-500">
              Each subject maintains its own syllabus, documents, and RAG knowledge base
            </p>
          </div>
          <Link
            to="/subjects/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </Link>
        </div>

        {subjects.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-semibold text-slate-700">No subjects yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Add your first subject and paste its syllabus to start generating study materials.
            </p>
            <Link
              to="/subjects/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" /> Create First Subject
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => {
              const isSelected = sub.id === selectedSubject?.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => selectSubject(sub.id)}
                  className={`p-5 rounded-2xl border transition cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-600/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{sub.name}</h4>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          sub.topics_status === 'ready'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sub.topics_status === 'failed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {sub.topics_status === 'ready' ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Ready
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 animate-spin" /> Parsing
                          </>
                        )}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        {sub.topics?.length || 0} topics
                      </span>
                      <span>•</span>
                      <span>{sub.pace || 'medium'} pace</span>
                      <span>•</span>
                      <span>{sub.time_frame_weeks}w frame</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                      {isSelected ? 'Active Subject' : 'Set as Active'}
                    </span>
                    <Link
                      to={`/subjects/${sub.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-indigo-600 p-1 transition"
                      title="View subject details & files"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

