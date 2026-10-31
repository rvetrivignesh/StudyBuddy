import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subjectsApi } from '../../api';
import { useSubject } from '../../context/SubjectContext';
import { BookOpen, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

export function SubjectCreatePage() {
  const navigate = useNavigate();
  const { refreshSubjects, selectSubject } = useSubject();

  const [formData, setFormData] = useState({
    name: '',
    syllabus: '',
    time_frame_weeks: 12,
    days_per_week: 4,
    pace: 'medium',
    exam_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.syllabus.trim().length < 10) {
      setError('Syllabus text must be at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        syllabus: formData.syllabus,
        time_frame_weeks: formData.time_frame_weeks,
        days_per_week: formData.days_per_week,
        pace: formData.pace,
        exam_date: formData.exam_date || null,
      };

      const newSubject = await subjectsApi.create(payload);
      await refreshSubjects();
      selectSubject(newSubject.id);
      navigate(`/subjects/${newSubject.id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Add New Subject</h1>
            <p className="text-xs text-slate-500">
              Provide your subject name and syllabus. Our AI will parse topic hierarchies automatically.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">Subject Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Distributed Systems & Cloud Computing"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-slate-800">
                Syllabus / Course Outline
              </label>
              <span className="text-xs text-indigo-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI will extract topic modules & weights
              </span>
            </div>
            <textarea
              name="syllabus"
              required
              rows={8}
              value={formData.syllabus}
              onChange={handleChange}
              placeholder="Paste chapters, modules, or lecture outline here...
Module 1: CAP Theorem & Consensus algorithms (Raft, Paxos)
Module 2: Distributed Hash Tables & Consistent Hashing
Module 3: MapReduce, Distributed Transactions & 2PC..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Time Frame (Weeks)
              </label>
              <input
                type="number"
                name="time_frame_weeks"
                min={1}
                max={52}
                value={formData.time_frame_weeks}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Study Days / Week
              </label>
              <input
                type="number"
                name="days_per_week"
                min={1}
                max={7}
                value={formData.days_per_week}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pace</label>
              <select
                name="pace"
                value={formData.pace}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              >
                <option value="slow">Slow & Steady</option>
                <option value="medium">Balanced (Medium)</option>
                <option value="fast">Intensive (Fast)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Exam Date (Optional)
              </label>
              <input
                type="date"
                name="exam_date"
                value={formData.exam_date}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving & Analyzing...
                </>
              ) : (
                'Create Subject'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

