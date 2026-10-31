import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { recallApi } from '../../api';
import { useSubject } from '../../context/SubjectContext';
import {
  HelpCircle,
  CheckCircle,
  XCircle,
  Mic,
  Square,
  Award,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export function RecallPage() {
  const [searchParams] = useSearchParams();
  const { selectedSubject } = useSubject();

  const [mode, setMode] = useState('mcq'); // 'mcq' | 'long'
  const [topic, setTopic] = useState(searchParams.get('topic') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // MCQ state
  const [mcqCount, setMcqCount] = useState(10);
  const [quizData, setQuizData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  // Long Answer state
  const [longQuestion, setLongQuestion] = useState(null);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [longFeedback, setLongFeedback] = useState(null);
  const [isEvaluatingLong, setIsEvaluatingLong] = useState(false);

  // Audio Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const topicParam = searchParams.get('topic');
    if (topicParam) {
      setTopic(topicParam);
    } else if (selectedSubject?.topics?.length > 0 && !topic) {
      setTopic(selectedSubject.topics[0].title);
    }
  }, [searchParams, selectedSubject]);

  // Generate MCQ Quiz
  const handleGenerateMCQ = async () => {
    if (!selectedSubject) {
      setError('Please select or create a subject first.');
      return;
    }
    if (!topic.trim()) {
      setError('Please enter or select a topic.');
      return;
    }

    setIsLoading(true);
    setError('');
    setQuizData(null);
    setQuizResult(null);
    setSelectedAnswers({});
    try {
      const data = await recallApi.generateMCQ({
        subject_id: selectedSubject.id,
        topic: topic.trim(),
        count: mcqCount,
      });
      setQuizData(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate MCQ quiz.');
    } finally {
      setIsLoading(false);
    }
  };

  // Select Option for Question
  const handleSelectOption = (qIdx, optIdx) => {
    if (quizResult) return; // locked after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx,
    }));
  };

  // Submit MCQ Answers
  const handleSubmitMCQ = async () => {
    if (!quizData) return;
    setIsSubmittingQuiz(true);
    setError('');
    try {
      const answersArray = quizData.questions.map((_, idx) =>
        selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : null
      );
      const res = await recallApi.submitMCQ(quizData.id, answersArray);
      setQuizResult(res);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit quiz.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Generate Long Answer Question
  const handleGenerateLongQuestion = async () => {
    if (!selectedSubject) {
      setError('Please select or create a subject first.');
      return;
    }
    if (!topic.trim()) {
      setError('Please enter or select a topic.');
      return;
    }

    setIsLoading(true);
    setError('');
    setLongQuestion(null);
    setLongFeedback(null);
    setStudentAnswer('');
    try {
      const data = await recallApi.getLongQuestion({
        subject_id: selectedSubject.id,
        topic: topic.trim(),
      });
      setLongQuestion(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate question.');
    } finally {
      setIsLoading(false);
    }
  };

  // Evaluate Long Answer
  const handleEvaluateLong = async () => {
    if (!longQuestion || !studentAnswer.trim()) return;
    setIsEvaluatingLong(true);
    setError('');
    try {
      const feedback = await recallApi.evaluateLongAnswer({
        subject_id: selectedSubject.id,
        topic: topic.trim(),
        question: longQuestion.question,
        answer: studentAnswer.trim(),
      });
      setLongFeedback(feedback);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Evaluation failed.');
    } finally {
      setIsEvaluatingLong(false);
    }
  };

  // Audio Recording (Voice Dictation)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const audioFile = new File([audioBlob], 'answer.webm', { type: 'audio/webm' });
          const res = await recallApi.transcribeAudio(audioFile);
          setStudentAnswer((prev) => (prev ? `${prev} ${res.text}` : res.text));
        } catch (err) {
          console.error(err);
          alert('Voice transcription failed. Whisper model might not be installed in backend.');
        } finally {
          setIsTranscribing(false);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-amber-600" /> Active Recall & Assessment
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Test your retention with instant multiple-choice grading or rubric-evaluated open responses.
            </p>
          </div>

          <div className="bg-slate-100 p-1 rounded-2xl flex items-center shrink-0">
            <button
              onClick={() => {
                setMode('mcq');
                setError('');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                mode === 'mcq'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4" /> MCQ Practice
            </button>
            <button
              onClick={() => {
                setMode('long');
                setError('');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                mode === 'long'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" /> Open-Ended Question
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
              placeholder="e.g. Distributed Consensus, Raft protocol, Database normalization..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {selectedSubject?.topics?.length > 0 && (
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none max-w-xs truncate"
            >
              <option value="">Or pick syllabus topic...</option>
              {selectedSubject.topics.map((t, i) => (
                <option key={i} value={t.title}>
                  {t.title}
                </option>
              ))}
            </select>
          )}

          {mode === 'mcq' && (
            <select
              value={mcqCount}
              onChange={(e) => setMcqCount(Number(e.target.value))}
              className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 font-medium"
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
            </select>
          )}

          <button
            onClick={mode === 'mcq' ? handleGenerateMCQ : handleGenerateLongQuestion}
            disabled={isLoading}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Preparing...
              </>
            ) : (
              'Start Quiz'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* MCQ Mode Render */}
      {mode === 'mcq' && quizData && (
        <div className="space-y-6">
          {/* Result Score Card if submitted */}
          {quizResult && (
            <div className="bg-gradient-to-r from-indigo-900 to-violet-900 rounded-3xl p-6 md:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-indigo-300">
                  Quiz Completed
                </span>
                <h3 className="text-2xl font-extrabold mt-1">
                  You scored {quizResult.score} out of {quizResult.total} (
                  {Math.round(quizResult.percentage)}%)
                </h3>
                <p className="text-xs text-indigo-200 mt-1">
                  Review the questions below. Explanations are highlighted for any missed concepts.
                </p>
              </div>

              <button
                onClick={handleGenerateMCQ}
                className="px-5 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow hover:bg-indigo-50 transition flex items-center gap-2 shrink-0"
              >
                <RotateCcw className="w-4 h-4" /> Retake Another Quiz
              </button>
            </div>
          )}

          {/* Question List */}
          <div className="space-y-4">
            {quizData.questions.map((q, qIdx) => {
              const res = quizResult?.results?.[qIdx];
              return (
                <div
                  key={qIdx}
                  className={`bg-white rounded-3xl border p-6 md:p-8 shadow-sm transition ${
                    res
                      ? res.is_correct
                        ? 'border-emerald-200'
                        : 'border-rose-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                      <span className="text-indigo-600 mr-2">{qIdx + 1}.</span> {q.question}
                    </h3>

                    {res && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          res.is_correct
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {res.is_correct ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> Correct
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Missed
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[qIdx] === optIdx;
                      const isCorrectAnswer = res && res.correct_index === optIdx;

                      let optClasses =
                        'p-3.5 rounded-2xl border text-xs md:text-sm text-left transition flex items-center gap-3 ';
                      if (res) {
                        if (isCorrectAnswer) {
                          optClasses +=
                            'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold';
                        } else if (isSelected && !res.is_correct) {
                          optClasses += 'bg-rose-50 border-rose-300 text-rose-950';
                        } else {
                          optClasses += 'bg-slate-50/50 border-slate-200 text-slate-500 opacity-60';
                        }
                      } else {
                        if (isSelected) {
                          optClasses +=
                            'bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold ring-2 ring-indigo-600/10';
                        } else {
                          optClasses +=
                            'bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={!!quizResult}
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={optClasses}
                        >
                          <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center font-bold text-xs shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation for missed questions */}
                  {res && !res.is_correct && res.explanation && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                      <span className="font-bold block mb-1">Explanation:</span>
                      {res.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Quiz Button */}
          {!quizResult && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmitMCQ}
                disabled={isSubmittingQuiz}
                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmittingQuiz ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Evaluating answers...
                  </>
                ) : (
                  <>
                    Submit Quiz <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Long Answer Mode Render */}
      {mode === 'long' && longQuestion && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Exam-Style Prompt
            </span>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-relaxed">
              {longQuestion.question}
            </h3>

            {/* Answer Input & Voice Dictation */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">Your Detailed Answer:</label>
                <div className="flex items-center gap-2">
                  {isRecording ? (
                    <button
                      onClick={stopRecording}
                      className="px-3 py-1 bg-rose-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-pulse"
                    >
                      <Square className="w-3.5 h-3.5" /> Stop Recording
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      disabled={isTranscribing}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Mic className="w-3.5 h-3.5 text-indigo-600" />
                      {isTranscribing ? 'Transcribing...' : 'Voice Dictate (Whisper)'}
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={7}
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="Type your explanation or click 'Voice Dictate' to speak your answer naturally..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />

              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleEvaluateLong}
                  disabled={isEvaluatingLong || !studentAnswer.trim()}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isEvaluatingLong ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Grading Answer...
                    </>
                  ) : (
                    'Grade My Answer'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* AI Rubric Feedback */}
          {longFeedback && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    AI Rubric Score
                  </span>
                  <div className="text-3xl font-black text-indigo-600 mt-0.5">
                    {longFeedback.score} <span className="text-base text-slate-400 font-medium">/ 10</span>
                  </div>
                </div>
                <p className="text-sm text-slate-700 font-medium max-w-lg text-right">
                  {longFeedback.overall}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Correct Points */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> What You Got Right
                  </h4>
                  <ul className="space-y-1.5 text-xs text-emerald-950">
                    {longFeedback.correct_points?.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Incorrect Points */}
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" /> Inaccuracies or Misconceptions
                  </h4>
                  <ul className="space-y-1.5 text-xs text-rose-950">
                    {longFeedback.incorrect_points?.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing Points */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> Missing Key Concepts
                  </h4>
                  <ul className="space-y-1.5 text-xs text-amber-950">
                    {longFeedback.missing_points?.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggestions */}
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Recommendations to Improve
                  </h4>
                  <ul className="space-y-1.5 text-xs text-indigo-950">
                    {longFeedback.suggestions?.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

