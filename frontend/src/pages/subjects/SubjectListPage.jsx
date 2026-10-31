import React from 'react';
import { Link } from 'react-router-dom';
import { useSubject } from '../../context/SubjectContext';
import {
  BookOpen,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  Layers,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export function SubjectListPage() {
  const { subjects, selectedSubjectId, selectSubject } = useSubject();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subjects & Materials</h1>
          <p className="text-sm text-slate-500">
            Manage your courses, view syllabus topic breakdowns, and upload lecture PDFs for RAG retrieval.
          </p>
        </div>
        <Link
          to="/subjects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </Link>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No subjects created yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Create a subject to let the AI organize your topics and generate study questions.
          </p>
          <Link
            to="/subjects/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" /> Create Subject
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <div
                key={sub.id}
                className={`bg-white rounded-2xl border transition flex flex-col justify-between overflow-hidden shadow-sm ${
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-slate-900 text-lg leading-snug">{sub.name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
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
                      ) : sub.topics_status === 'failed' ? (
                        <>
                          <AlertCircle className="w-3 h-3" /> Failed
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 animate-spin" /> Parsing
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-3 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                    {sub.syllabus}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Topics</span>
                      <span className="font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                        <Layers className="w-3 h-3 text-indigo-500" /> {sub.topics?.length || 0}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Schedule</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{sub.days_per_week}d/wk</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Pace</span>
                      <span className="font-bold text-slate-800 capitalize mt-0.5 block">{sub.pace}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => selectSubject(sub.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    {isSelected ? 'Active Subject' : 'Select'}
                  </button>

                  <Link
                    to={`/subjects/${sub.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
                  >
                    Manage & Upload Files <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

