import React, { useState } from 'react';
import { Sparkles, X, BookOpen, FileText, Code2, CheckSquare, Layers, AlertCircle, Loader2 } from 'lucide-react';
import { AIGenerationOptions, CardType, Deck } from '../types';
import { generateFlashcardsClientSide } from '../lib/cardGenerator';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDeck: Partial<Deck>, generatedCards: any[]) => void;
  targetExistingDeck?: Deck | null;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetExistingDeck,
}) => {
  const [sourceType, setSourceType] = useState<'topic' | 'text'>('topic');
  const [title, setTitle] = useState(targetExistingDeck?.title || '');
  const [sourceContent, setSourceContent] = useState('');
  const [cardCount, setCardCount] = useState(8);
  const [cardTypes, setCardTypes] = useState<CardType[]>(['qa', 'cloze', 'code', 'mcq']);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [targetLanguage, setTargetLanguage] = useState<'auto' | 'ru' | 'en'>('auto');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const toggleCardType = (type: CardType) => {
    if (cardTypes.includes(type)) {
      if (cardTypes.length === 1) return; // keep at least 1
      setCardTypes(cardTypes.filter((t) => t !== type));
    } else {
      setCardTypes([...cardTypes, type]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!sourceContent.trim()) {
      setErrorMessage(
        sourceType === 'topic'
          ? 'Please enter a topic or concept name.'
          : 'Please paste lecture text or document content.'
      );
      return;
    }

    setIsLoading(true);
    setLoadingStep('Extracting concepts & building SM-2 cards...');

    try {
      // Simulate quick smooth UI progress
      await new Promise((res) => setTimeout(res, 400));

      const result = generateFlashcardsClientSide({
        title: title || sourceContent.slice(0, 40),
        sourceType,
        sourceContent,
        cardCount,
        cardTypes,
        difficulty,
        targetLanguage,
      });

      onSuccess(
        {
          title: targetExistingDeck ? targetExistingDeck.title : (result.deckTitle || title || 'New Flashcard Deck'),
          description: result.deckDescription,
          tags: result.tags,
        },
        result.cards || []
      );

      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred during card generation.');
    } finally {
      setIsLoading(false);
    }
  };

  const topicPresets = [
    { label: 'PostgreSQL Architecture', val: 'Архитектура и внутренности PostgreSQL: WAL, MVCC, B-Tree, Vacuum' },
    { label: 'System Design', val: 'System Design: CAP-теорема, Consistent Hashing, Rate Limiting, Circuit Breaker' },
    { label: 'TypeScript & React 19', val: 'TypeScript 5 & React 19: Discriminated Unions, Fiber, Server Components, Hooks' },
    { label: 'Risk Management', val: 'Управление рисками: VaR, Хеджирование, Операционные и рыночные риски' },
  ];

  return (
    <div id="ai_generator_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-slate-200/80 rounded-2xl shadow-xl p-6 text-slate-900 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#24389c]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {targetExistingDeck ? `Add Cards to "${targetExistingDeck.title}"` : 'AI Flashcard Generator'}
            </h2>
            <p className="text-xs text-slate-500">
              Convert notes, syllabus, or topics into SuperMemo SM-2 flashcards.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-5">
          {/* Input Type Selection */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSourceType('topic')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                sourceType === 'topic' ? 'bg-white text-[#24389c] shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#24389c]" />
              <span>Topic Keywords</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceType('text')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                sourceType === 'text' ? 'bg-white text-[#24389c] shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Paste Notes / Docs</span>
            </button>
          </div>

          {/* Deck Title if creating new */}
          {!targetExistingDeck && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Deck Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., PostgreSQL Internals or System Design"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#24389c] focus:bg-white"
              />
            </div>
          )}

          {/* Source Content Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {sourceType === 'topic' ? 'Topic Name or Concepts' : 'Paste Lecture Notes or Article'}
            </label>
            <textarea
              rows={4}
              value={sourceContent}
              onChange={(e) => setSourceContent(e.target.value)}
              placeholder={
                sourceType === 'topic'
                  ? 'e.g., "PostgreSQL Architecture: WAL, MVCC, Buffer Pool, B-Tree and Vacuum"'
                  : 'Paste raw study notes, article excerpts, or documentation...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#24389c] focus:bg-white"
            />

            {/* Quick Topic Presets */}
            {sourceType === 'topic' && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 self-center mr-1">
                  Preset:
                </span>
                {topicPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTitle(preset.label);
                      setSourceContent(preset.val);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-[#24389c] border border-slate-200 transition-colors font-medium"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Card Formats Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Allowed Card Formats
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'qa', label: 'Q&A Direct', icon: BookOpen },
                { type: 'cloze', label: 'Cloze Blank', icon: FileText },
                { type: 'code', label: 'Code Snippet', icon: Code2 },
                { type: 'mcq', label: 'Multiple Choice', icon: CheckSquare },
              ].map(({ type, label, icon: Icon }) => {
                const active = cardTypes.includes(type as CardType);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleCardType(type as CardType)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-indigo-50 border-indigo-200 text-[#24389c]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-[#24389c]" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options Row: Card Count, Difficulty, Language */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Card Count: <span className="text-[#24389c] font-bold">{cardCount}</span>
              </label>
              <input
                type="range"
                min="3"
                max="20"
                step="1"
                value={cardCount}
                onChange={(e) => setCardCount(parseInt(e.target.value))}
                className="w-full accent-[#24389c] cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e: any) => setDifficulty(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#24389c]"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Language
              </label>
              <select
                value={targetLanguage}
                onChange={(e: any) => setTargetLanguage(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#24389c]"
              >
                <option value="auto">Auto Detect</option>
                <option value="ru">Russian (Русский)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              id="btn_submit_ai_generation"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-[#24389c] hover:bg-[#1a2a7a] text-white font-bold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{loadingStep}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Generate {cardCount} Anki Flashcards</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
