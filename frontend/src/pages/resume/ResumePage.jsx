import React, { useState, useEffect } from 'react';
import { resumeApi } from '../../api';
import {
  FileText,
  UploadCloud,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Award,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export function ResumePage() {
  const [resume, setResume] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resData, anaData] = await Promise.allSettled([
        resumeApi.get(),
        resumeApi.latestAnalysis(),
      ]);
      if (resData.status === 'fulfilled') setResume(resData.value);
      if (anaData.status === 'fulfilled') setAnalysis(anaData.value);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    try {
      const data = await resumeApi.upload(file);
      setResume(data);
      // Automatically analyze after upload
      const ana = await resumeApi.analyze(jobDescription);
      setAnalysis(ana);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to parse resume.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setError('');
    try {
      const res = await resumeApi.analyze(jobDescription);
      setAnalysis(res);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-sky-600" /> Resume ATS & Skill Gap Scanner
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Upload your resume to extract competencies and analyze readiness against job descriptions or course syllabi.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-indigo-700 shadow-sm transition shrink-0">
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Parsing Resume...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" /> Upload Resume (PDF/DOCX)
              </>
            )}
            <input
              type="file"
              disabled={isUploading}
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Parsed Resume Card */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" /> Parsed Candidate Profile
          </h3>

          {!resume ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No resume uploaded yet. Click upload above to parse your skills & experience.
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Name</span>
                <p className="font-bold text-slate-900 text-sm">{resume.name || 'Not detected'}</p>
              </div>

              {resume.skills?.length > 0 && (
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block mb-1.5">
                    Skills & Tech
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {resume.experience?.length > 0 && (
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block mb-1">
                    Experience
                  </span>
                  <div className="space-y-2">
                    {resume.experience.map((exp, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="font-bold text-slate-800">{exp.role || exp.title}</p>
                        <p className="text-slate-500 text-[11px]">{exp.company}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resume.education?.length > 0 && (
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block mb-1">
                    Education
                  </span>
                  <div className="space-y-2">
                    {resume.education.map((edu, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="font-bold text-slate-800">{edu.degree || edu.institution}</p>
                        <p className="text-slate-500 text-[11px]">{edu.year || ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Job Description & AI Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Role input */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">
              Target Job Description / Syllabus Requirements (Optional)
            </h3>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste target job description or internship qualifications here to tailor the gap analysis..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || !resume}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing ATS Gaps...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Run Skill Gap Analysis
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">ATS Analysis & Feedback</h3>
                {analysis.score !== undefined && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Readiness Match
                    </span>
                    <span className="text-2xl font-black text-indigo-600">
                      {analysis.score} / 100
                    </span>
                  </div>
                )}
              </div>

              {/* Strengths */}
              {analysis.strengths?.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Key Strengths
                  </h4>
                  <ul className="space-y-1.5 text-xs text-emerald-950">
                    {analysis.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gaps / Missing Skills */}
              {analysis.gaps?.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" /> Identified Skill Gaps & Deficiencies
                  </h4>
                  <ul className="space-y-1.5 text-xs text-rose-950">
                    {analysis.gaps.map((gap, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {analysis.suggestions?.length > 0 && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Actionable Recommendations
                  </h4>
                  <ul className="space-y-1.5 text-xs text-indigo-950">
                    {analysis.suggestions.map((sug, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

