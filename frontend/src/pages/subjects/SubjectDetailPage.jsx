import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { subjectsApi, documentsApi } from '../../api';
import { useSubject } from '../../context/SubjectContext';
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  Calendar,
  HelpCircle,
  Loader2,
} from 'lucide-react';

export function SubjectDetailPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { selectSubject, refreshSubjects } = useSubject();

  const [subject, setSubject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isReparsing, setIsReparsing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' | 'topics'

  const fetchData = useCallback(async () => {
    try {
      const [subData, docsData] = await Promise.all([
        subjectsApi.get(subjectId),
        documentsApi.list(subjectId),
      ]);
      setSubject(subData);
      setDocuments(docsData);
    } catch (err) {
      console.error('Error fetching subject details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchData();
    selectSubject(subjectId);
  }, [subjectId]);

  // Poll when any document is pending or syllabus parsing is pending
  useEffect(() => {
    const hasPendingDoc = documents.some((d) => d.status === 'pending');
    const isSyllabusPending = subject?.topics_status === 'pending';

    if (hasPendingDoc || isSyllabusPending) {
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [documents, subject?.topics_status, fetchData]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    try {
      await documentsApi.upload(subjectId, file);
      await fetchData();
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document and remove its chunks from the vector store?')) return;
    try {
      await documentsApi.delete(subjectId, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document.');
    }
  };

  const handleReparseSyllabus = async () => {
    setIsReparsing(true);
    try {
      await subjectsApi.reparseSyllabus(subjectId);
      await fetchData();
      await refreshSubjects();
    } catch (err) {
      console.error(err);
      alert('Failed to reparse syllabus.');
    } finally {
      setIsReparsing(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!window.confirm(`Are you sure you want to delete ${subject?.name}? This cannot be undone.`)) return;
    try {
      await subjectsApi.delete(subjectId);
      await refreshSubjects();
      navigate('/subjects');
    } catch (err) {
      console.error(err);
      alert('Failed to delete subject.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Subject not found.</p>
        <Link to="/subjects" className="text-indigo-600 font-semibold mt-2 inline-block">
          Return to Subjects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/subjects')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> All Subjects
        </button>

        <button
          onClick={handleDeleteSubject}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition"
        >
          Delete Subject
        </button>
      </div>

      {/* Header Info Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  subject.topics_status === 'ready'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : subject.topics_status === 'failed'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {subject.topics_status === 'ready' ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Syllabus Ready
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" /> Parsing Syllabus Topics
                  </>
                )}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">{subject.pace} pace</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">{subject.time_frame_weeks} weeks</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{subject.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReparseSyllabus}
              disabled={isReparsing || subject.topics_status === 'pending'}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
              title="Rerun AI topic extraction on syllabus"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReparsing ? 'animate-spin' : ''}`} />
              Reparse Syllabus
            </button>
            <Link
              to="/learn"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Study Topics
            </Link>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 mt-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" /> Study Materials ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'topics'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> Extracted Topics ({subject.topics?.length || 0})
          </button>
        </div>
      </div>

      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Upload Dropzone */}
          <div className="bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition rounded-3xl p-8 text-center bg-indigo-50/20">
            <UploadCloud className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Upload Course Notes & PDFs</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Upload textbook chapters, slide decks, or lecture notes (PDF, DOCX, PPTX, TXT, MD).
              The backend automatically chunks, embeds, and indexes them into Qdrant for RAG citations.
            </p>

            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold cursor-pointer hover:bg-indigo-700 shadow-sm transition">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Ingesting file...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" /> Choose File
                </>
              )}
              <input
                type="file"
                disabled={isUploading}
                accept=".pdf,.docx,.pptx,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {uploadError && (
              <p className="text-xs text-rose-600 mt-3 font-medium">{uploadError}</p>
            )}
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Indexed Files</h3>
              <button
                onClick={fetchData}
                className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No documents uploaded for this subject yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{doc.filename}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span>{doc.chunk_count || 0} vectorized chunks</span>
                          {doc.error && (
                            <span className="text-rose-500 font-medium truncate max-w-xs">
                              • {doc.error}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                          doc.status === 'ready'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : doc.status === 'failed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {doc.status === 'ready' ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Indexed in Qdrant
                          </>
                        ) : doc.status === 'failed' ? (
                          <>
                            <AlertCircle className="w-3 h-3" /> Ingestion Failed
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 animate-spin" /> Chunking & Embedding...
                          </>
                        )}
                      </span>

                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              AI-Parsed Topic Hierarchy
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Extracted from your syllabus text. These topics power the Flashcard deck, Deep Dive tutor, and MCQ quiz generator.
            </p>

            {subject.topics?.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No topics extracted yet. Click "Reparse Syllabus" above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subject.topics.map((t, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        {t.title}
                      </h4>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        Weight: {t.weight}/5
                      </span>
                    </div>

                    {t.subtopics?.length > 0 && (
                      <ul className="mt-2 space-y-1 pl-7 list-disc text-xs text-slate-600">
                        {t.subtopics.map((sub, sIdx) => (
                          <li key={sIdx}>{sub}</li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-end gap-2">
                      <Link
                        to={`/learn?topic=${encodeURIComponent(t.title)}`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Deep Dive
                      </Link>
                      <span className="text-slate-300">|</span>
                      <Link
                        to={`/recall?topic=${encodeURIComponent(t.title)}`}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> Quiz
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

