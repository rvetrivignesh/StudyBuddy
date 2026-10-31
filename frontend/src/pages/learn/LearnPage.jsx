import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { learnApi } from '../../api';
import { useSubject } from '../../context/SubjectContext';
import {
  Sparkles,
  Layers,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export function LearnPage() {
  const [searchParams] = useSearchParams();
  const { selectedSubject } = useSubject();

  const [mode, setMode] = useState('deep-dive'); // 'deep-dive' | 'flashcards'
  const [topic, setTopic] = useState(searchParams.get('topic') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Deep dive data
  const [deepDiveData, setDeepDiveData] = useState(null);

  // Flashcards data
  const [flashcardsData, setFlashcardsData] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardCount, setCardCount] = useState(10);

  // Sync topic from url or first subject topic
  useEffect(() => {
    const topicParam = searchParams.get('topic');
    if (topicParam) {
      setTopic(topicParam);
    } else if (selectedSubject?.topics?.length > 0 && !topic) {
      setTopic(selectedSubject.topics[0].title);
    }
  }, [searchParams, selectedSubject]);

  const handleFetchDeepDive = async (refresh = false) => {
    if (!selectedSubject) {
      setError('Please select or create a subject first.');
      return;
    }
    if (!topic.trim()) {
      setError('Please enter a topic to study.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await learnApi.getDeepDive({
        subject_id: selectedSubject.id,
        topic: topic.trim(),
        refresh,
      });
      setDeepDiveData(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate deep dive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchFlashcards = async (refresh = false) => {
    if (!selectedSubject) {
      setError('Please select or create a subject first.');
      return;
    }
    if (!topic.trim()) {
      setError('Please enter a topic for flashcards.');
      return;
    }

    setIsLoading(true);
    setError('');
    setCurrentCardIndex(0);
    setIsFlipped(false);
    try {
      const data = await learnApi.getFlashcards({
        subject_id: selectedSubject.id,
        topic: topic.trim(),
        count: cardCount,
        refresh,
      });
      setFlashcardsData(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate flashcards.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextCard = () => {
    if (!flashcardsData?.cards) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % flashcardsData.cards.length);
  };

  const handlePrevCard = () => {
    if (!flashcardsData?.cards) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) =>
      prev === 0 ? flashcardsData.cards.length - 1 : prev - 1
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" /> Learn & Master Topics
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Grounded explanations and active recall cards generated from your notes & syllabus.
            </p>
          </div>

          <div className="bg-slate-100 p-1 rounded-2xl flex items-center shrink-0">
            <button
              onClick={() => {
                setMode('deep-dive');
                setError('');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                mode === 'deep-dive'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Deep Dive Guide
            </button>
            <button
              onClick={() => {
                setMode('flashcards');
                setError('');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                mode === 'flashcards'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" /> Flashcard Deck
            </button>
          </div>
        </div>

        {/* Topic Input Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Consistent Hashing, Dijkstra's Algorithm, Keynesian Economics..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {selectedSubject?.topics?.length > 0 && (
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none max-w-xs truncate"
            >
              <option value="">Or pick from syllabus topics...</option>
              {selectedSubject.topics.map((t, i) => (
                <option key={i} value={t.title}>
                  {t.title}
                </option>
              ))}
            </select>
          )}

          {mode === 'flashcards' && (
            <select
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-medium"
            >
              <option value={5}>5 Cards</option>
              <option value={10}>10 Cards</option>
              <option value={15}>15 Cards</option>
            </select>
          )}

          <button
            onClick={() =>
              mode === 'deep-dive' ? handleFetchDeepDive() : handleFetchFlashcards()
            }
            disabled={isLoading}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              'Start Learning'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Deep Dive Mode Render */}
      {mode === 'deep-dive' && deepDiveData && (
        <div className="space-y-6">
          {/* Status & Grounding banner */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold ${
                deepDiveData.grounded
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {deepDiveData.grounded ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Grounded in your uploaded notes
                </>
              ) : (
                'General curriculum knowledge'
              )}
            </span>

            <button
              onClick={() => handleFetchDeepDive(true)}
              disabled={isLoading}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate Explanation
            </button>
          </div>

          {/* Intuition & Overview Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">{deepDiveData.topic}</h2>

            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-indigo-600" /> Intuition (The Big Idea)
              </h4>
              <p className="text-sm text-indigo-950 leading-relaxed font-medium">
                {deepDiveData.intuition}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Overview & Context
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {deepDiveData.overview}
              </p>
            </div>
          </div>

          {/* Key Concepts Grid */}
          {deepDiveData.key_concepts?.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Core Concepts & Definitions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deepDiveData.key_concepts.map((concept, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{concept.name}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{concept.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Worked Example */}
          {deepDiveData.worked_example && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-2">Worked Example / Walkthrough</h3>
              <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl text-xs md:text-sm font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {deepDiveData.worked_example}
              </div>
            </div>
          )}

          {/* Common Mistakes */}
          {deepDiveData.common_mistakes?.length > 0 && (
            <div className="bg-white rounded-3xl border border-amber-200 p-6 md:p-8 shadow-sm bg-amber-50/10">
              <h3 className="text-base font-bold text-amber-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" /> Common Traps & Exam Pitfalls
              </h3>
              <ul className="space-y-2">
                {deepDiveData.common_mistakes.map((mistake, idx) => (
                  <li key={idx} className="text-xs text-amber-950 flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary & Sources */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Executive Takeaway
              </h4>
              <p className="text-sm text-slate-800 leading-relaxed">{deepDiveData.summary}</p>
            </div>

            {deepDiveData.sources?.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h5 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Cited Sources from Uploaded Notes:
                </h5>
                <div className="space-y-2">
                  {deepDiveData.sources.map((src, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">[{idx + 1}] {src.title}</span>
                      {src.location && <span className="text-indigo-600 ml-1">({src.location})</span>}
                      <p className="text-slate-500 italic mt-0.5 line-clamp-2">"{src.snippet}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flashcards Mode Render */}
      {mode === 'flashcards' && flashcardsData?.cards && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Card {currentCardIndex + 1} of {flashcardsData.cards.length}
            </span>

            <button
              onClick={() => handleFetchFlashcards(true)}
              disabled={isLoading}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate Deck
            </button>
          </div>

          {/* Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-80 cursor-pointer select-none perspective"
          >
            <div
              className={`w-full h-full rounded-3xl border transition-all duration-300 p-8 flex flex-col justify-between shadow-md ${
                isFlipped
                  ? 'bg-gradient-to-br from-indigo-900 to-violet-950 text-white border-indigo-700'
                  : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    isFlipped
                      ? 'bg-indigo-800 text-indigo-200'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  {isFlipped ? 'Answer / Explanation' : 'Question / Concept'}
                </span>
                <span className="text-xs opacity-60 flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" /> Click to flip
                </span>
              </div>

              <div className="my-auto text-center px-4">
                <p className="text-lg md:text-xl font-bold leading-relaxed">
                  {isFlipped
                    ? flashcardsData.cards[currentCardIndex].back
                    : flashcardsData.cards[currentCardIndex].front}
                </p>
              </div>

              <div className="text-center">
                <span className="text-xs opacity-40">StudyBuddy Spaced Recall</span>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePrevCard}
              className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition"
              title="Previous Card"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" /> Flip
            </button>

            <button
              onClick={handleNextCard}
              className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition"
              title="Next Card"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

