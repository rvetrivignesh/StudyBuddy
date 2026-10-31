import React, { useState, useEffect } from 'react';
import { plannerApi } from '../../api';
import { useSubject } from '../../context/SubjectContext';
import {
  Calendar as CalendarIcon,
  Download,
  Sparkles,
  AlertTriangle,
  Clock,
  BookOpen,
  RotateCcw,
  CheckCircle,
  Loader2,
} from 'lucide-react';

export function PlannerPage() {
  const { selectedSubject } = useSubject();

  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    exam_date: '',
    start_date: '',
    session_start: '18:00',
    use_ai_weights: true,
  });

  // Load existing plan if any
  useEffect(() => {
    async function loadPlan() {
      if (!selectedSubject) return;
      setIsLoading(true);
      setError('');
      try {
        const existing = await plannerApi.getPlan(selectedSubject.id);
        setPlan(existing);
      } catch (err) {
        // 404 or no plan yet is expected
        setPlan(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadPlan();
  }, [selectedSubject]);

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    if (!selectedSubject) {
      setError('Please select or create a subject first.');
      return;
    }

    setIsGenerating(true);
    setError('');
    try {
      const payload = {
        exam_date: formData.exam_date || null,
        start_date: formData.start_date || null,
        session_start: formData.session_start || '18:00',
        use_ai_weights: formData.use_ai_weights,
      };

      const newPlan = await plannerApi.generatePlan(selectedSubject.id, payload);
      setPlan(newPlan);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadICS = () => {
    if (!selectedSubject) return;
    const url = plannerApi.getExportIcsUrl(selectedSubject.id);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-plan-${selectedSubject.name.toLowerCase().replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-emerald-600" /> AI Study Plan & Calendar
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Spaced-repetition study schedule calculated from syllabus topics and your exam deadline.
            </p>
          </div>

          {plan && (
            <button
              onClick={handleDownloadICS}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Export .ics (Google/Apple Calendar)
            </button>
          )}
        </div>

        {/* Plan Configuration Form */}
        <form onSubmit={handleGeneratePlan} className="mt-6 pt-6 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Exam / Target Date
              </label>
              <input
                type="date"
                value={formData.exam_date}
                onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Daily Session Time
              </label>
              <input
                type="time"
                value={formData.session_start}
                onChange={(e) => setFormData({ ...formData, session_start: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="aiWeights"
                checked={formData.use_ai_weights}
                onChange={(e) => setFormData({ ...formData, use_ai_weights: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="aiWeights" className="text-xs font-semibold text-slate-700">
                Use AI topic weights
              </label>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Scheduling sessions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> (Re)generate Study Plan
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Warnings Banner if any */}
      {plan?.warnings?.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950">
            <h4 className="font-bold mb-1">Schedule Notice:</h4>
            <ul className="list-disc pl-4 space-y-0.5">
              {plan.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Events Timeline / List */}
      {plan?.events && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">
              Scheduled Study Sessions ({plan.events.length} sessions)
            </h3>
            <span className="text-xs text-slate-500">
              Exam: <strong className="text-slate-800">{plan.exam_date}</strong>
            </span>
          </div>

          <div className="space-y-3">
            {plan.events.map((evt, idx) => {
              const badgeClasses =
                evt.kind === 'learn'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : evt.kind === 'revise'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-violet-50 text-violet-700 border-violet-200';

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {new Date(evt.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="text-xs font-black text-slate-800">
                        {new Date(evt.date).getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeClasses}`}
                        >
                          {evt.kind}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{evt.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500">{evt.topic}</p>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1 sm:justify-end">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(evt.start).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(evt.end).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

