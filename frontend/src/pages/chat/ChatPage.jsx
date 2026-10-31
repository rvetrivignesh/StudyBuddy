import React, { useState, useEffect, useRef } from 'react';
import { chatApi } from '../../api';
import { useSubject } from '../../context/SubjectContext';
import {
  MessageSquare,
  Send,
  Plus,
  BookOpen,
  FileText,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function ChatPage() {
  const { selectedSubject, subjects, selectSubject } = useSubject();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});

  const messagesEndRef = useRef(null);

  // Load conversations when subject changes
  useEffect(() => {
    async function loadConversations() {
      try {
        const list = await chatApi.listConversations(selectedSubject?.id);
        setConversations(list);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      }
    }
    loadConversations();
  }, [selectedSubject]);

  // Load active conversation messages
  useEffect(() => {
    async function loadActiveConversation() {
      if (!activeConvId) {
        setMessages([]);
        return;
      }
      try {
        const conv = await chatApi.getConversation(activeConvId);
        setMessages(conv.messages || []);
      } catch (err) {
        console.error('Failed to load conversation details:', err);
      }
    }
    loadActiveConversation();
  }, [activeConvId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleStartNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    // Optimistic UI update
    const tempUserMsg = { role: 'user', content: userText };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      const res = await chatApi.sendMessage({
        subject_id: selectedSubject?.id,
        message: userText,
        conversation_id: activeConvId,
      });

      if (!activeConvId) {
        setActiveConvId(res.conversation_id);
        const list = await chatApi.listConversations(selectedSubject?.id);
        setConversations(list);
      }

      // Add assistant response with sources
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          sources: res.sources,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I encountered an error connecting to the model or knowledge base. Please check if your Ollama or LLM provider is active.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const toggleSources = (idx) => {
    setExpandedSources((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Conversations Sidebar */}
      <div className="w-72 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Study Chats
          </span>
          <button
            onClick={handleStartNewChat}
            className="p-1.5 rounded-xl bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 shadow-sm transition"
            title="New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <button
            onClick={handleStartNewChat}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              !activeConvId
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-4 h-4" /> Start New Question
          </button>

          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveConvId(c.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition truncate flex items-center gap-2 ${
                activeConvId === c.id
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{c.title || 'Untitled Conversation'}</span>
            </button>
          ))}
        </div>

        {/* Current Subject indicator in Chat sidebar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Grounded To:
          </span>
          <select
            value={selectedSubject?.id || ''}
            onChange={(e) => selectSubject(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-medium truncate focus:outline-none"
          >
            <option value="">General Knowledge (No Subject)</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white/70 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {selectedSubject
                  ? `AI Tutor (${selectedSubject.name})`
                  : 'AI Study Assistant'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {selectedSubject
                  ? 'Vector search enabled across your uploaded PDFs & notes'
                  : 'Select a subject to enable course-grounded RAG answers'}
              </p>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Ask anything about your course</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                The tutor searches your uploaded documents with Qdrant vector retrieval, pulls exact snippets, and explains complex concepts.
              </p>

              <div className="grid grid-cols-1 gap-2 w-full text-left">
                {[
                  'Explain the hardest concept in this course with an analogy',
                  'What are the key formulas or algorithms in module 2?',
                  'Give me a summary of our lecture notes on this subject',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInputMessage(prompt)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 text-xs text-slate-700 transition"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const hasSources = msg.sources && msg.sources.length > 0;
              const isSourceExpanded = expandedSources[idx];

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-2xl px-5 py-3.5 rounded-3xl text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-50 text-slate-900 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Sources section if returned by RAG */}
                    {hasSources && (
                      <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
                        <button
                          onClick={() => toggleSources(idx)}
                          className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{msg.sources.length} Cited Sources</span>
                          {isSourceExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {isSourceExpanded && (
                          <div className="mt-2 space-y-2">
                            {msg.sources.map((s, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700"
                              >
                                <span className="font-semibold text-slate-900">
                                  [{sIdx + 1}] {s.title}
                                </span>
                                {s.location && (
                                  <span className="text-indigo-600 ml-1">({s.location})</span>
                                )}
                                <p className="text-slate-500 italic mt-0.5 font-mono text-[11px]">
                                  "{s.snippet}"
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Retrieving notes & thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question about your course..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

