import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code2,
  BookOpen,
  FileText,
  CheckSquare,
  RotateCw,
  Send,
  Loader2,
  Brain,
  Lightbulb,
  Award,
  ChevronRight,
  Key,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Deck, Flashcard, SM2Rating, AnswerEvaluation } from '../types';
import { calculateSM2, getNextIntervalText } from '../lib/sm2';

interface StudySessionProps {
  deck: Deck;
  onFinish: (updatedCards: Flashcard[], sessionStats: { reviewed: number; correct: number }) => void;
  onBack: () => void;
}

export const StudySession: React.FC<StudySessionProps> = ({ deck, onFinish, onBack }) => {
  // Queue of cards to review
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Free-form user answer and AI evaluation
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<AnswerEvaluation | null>(null);

  // AI ELI5 Explanation drawer/modal
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiExplanationText, setAiExplanationText] = useState('');
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // MCQ selection
  const [selectedMcqOption, setSelectedMcqOption] = useState<number | null>(null);

  // Session metrics
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [updatedCardMap, setUpdatedCardMap] = useState<Record<string, Flashcard>>({});
  const [isFinished, setIsFinished] = useState(false);

  // Speech TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Initialize queue
  useEffect(() => {
    if (deck.cards && deck.cards.length > 0) {
      // Prioritize due cards first
      const due = deck.cards.filter((c) => !c.dueDate || new Date(c.dueDate) <= new Date());
      const nonDue = deck.cards.filter((c) => c.dueDate && new Date(c.dueDate) > new Date());
      const combined = due.length > 0 ? [...due, ...nonDue] : [...deck.cards];
      setQueue(combined);

      // Store initial map of cards
      const map: Record<string, Flashcard> = {};
      deck.cards.forEach((c) => {
        map[c.id] = c;
      });
      setUpdatedCardMap(map);
    }
  }, [deck]);

  const currentCard = queue[currentIndex];

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing inside textarea or input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        if (e.key === 'Enter' && e.ctrlKey) {
          handleEvaluateAnswer();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleRateCard(1);
        else if (e.key === '2') handleRateCard(2);
        else if (e.key === '3') handleRateCard(3);
        else if (e.key === '4') handleRateCard(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, queue, userAnswer]);

  if (!deck.cards || deck.cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200/80 text-center text-slate-700 shadow-xs">
        <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">Deck is empty</h3>
        <p className="text-sm text-slate-500 mb-6">There are no cards in this deck yet.</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl bg-[#24389c] hover:bg-[#1a2a7a] text-white font-semibold text-sm"
        >
          Return to Decks
        </button>
      </div>
    );
  }

  // Handle Speech Synthesis
  const handleSpeak = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Evaluate User Answer via AI Endpoint
  const handleEvaluateAnswer = async () => {
    if (!currentCard || !userAnswer.trim()) return;

    setIsEvaluating(true);
    try {
      const response = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentCard.question,
          expectedAnswer: currentCard.answer,
          userAnswer,
          cardType: currentCard.type,
          explanation: currentCard.explanation,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setAiEvaluation(data.evaluation);
        setIsFlipped(true); // flip to show results
      }
    } catch (e) {
      console.error('Failed to evaluate answer', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Ask AI for ELI5 Explanation
  const handleFetchExplanation = async () => {
    if (!currentCard) return;

    setIsExplaining(true);
    setShowExplanationModal(true);

    try {
      const response = await fetch('/api/explain-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentCard.question,
          answer: currentCard.answer,
          explanation: currentCard.explanation,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setAiExplanationText(data.explanation);
      } else {
        setAiExplanationText('Failed to generate AI explanation.');
      }
    } catch (e) {
      console.error(e);
      setAiExplanationText('Error loading AI explanation.');
    } finally {
      setIsExplaining(false);
    }
  };

  // Rate card with SM-2 rating (1: Again, 2: Hard, 3: Good, 4: Easy)
  const handleRateCard = (rating: SM2Rating) => {
    if (!currentCard) return;

    const updatedCard = calculateSM2(currentCard, rating, userAnswer, aiEvaluation?.score);

    // Save updated card in local dictionary
    setUpdatedCardMap((prev) => ({
      ...prev,
      [updatedCard.id]: updatedCard,
    }));

    setReviewedCount((prev) => prev + 1);
    if (rating >= 3) {
      setCorrectCount((prev) => prev + 1);
    }

    // Reset card state for next card
    setIsFlipped(false);
    setUserAnswer('');
    setAiEvaluation(null);
    setSelectedMcqOption(null);

    // Advance to next card or complete session
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Session Completed!
      setIsFinished(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Complete and save back to parent
  const handleFinishSession = () => {
    const finalCards = Object.values(updatedCardMap);
    onFinish(finalCards, { reviewed: reviewedCount, correct: correctCount });
  };

  // Render Cloze Deletion Text helper
  const renderClozeText = (text: string, showHidden: boolean) => {
    const parts = text.split(/(\{\{c1::.*?\}\})/g);
    return (
      <span className="leading-relaxed">
        {parts.map((part, idx) => {
          if (part.startsWith('{{c1::') && part.endsWith('}}')) {
            const hiddenValue = part.slice(6, -2);
            return showHidden ? (
              <span
                key={idx}
                className="px-2 py-0.5 mx-1 font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              >
                {hiddenValue}
              </span>
            ) : (
              <span
                key={idx}
                className="px-3 py-0.5 mx-1 font-mono font-bold rounded-md bg-indigo-500/30 text-indigo-300 border border-indigo-500/50"
              >
                [ ... ]
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </span>
    );
  };

  // Session Completed Screen
  if (isFinished) {
    const accuracy = reviewedCount > 0 ? Math.round((correctCount / reviewedCount) * 100) : 100;
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-slate-200/80 rounded-3xl text-center text-slate-900 shadow-xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-[#24389c] to-[#3f51b5] flex items-center justify-center text-white shadow-md">
          <Award className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold mb-1 text-slate-900">Session Complete!</h2>
        <p className="text-xs text-slate-500 mb-6">
          Great job! SuperMemo SM-2 algorithm updated your review schedule.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="text-3xl font-extrabold text-[#24389c]">{reviewedCount}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Cards Reviewed</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
            <div className="text-3xl font-extrabold text-emerald-600">{accuracy}%</div>
            <div className="text-xs font-semibold text-emerald-800 mt-1">Retention Accuracy</div>
          </div>
        </div>

        <button
          id="btn_finish_session"
          onClick={handleFinishSession}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#24389c] hover:bg-[#1a2a7a] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          Return to Deck Dashboard
        </button>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / queue.length) * 100);

  return (
    <div id="study_session_container" className="max-w-3xl mx-auto px-4 py-6 text-slate-900">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Exit Session</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">
            Card <strong className="text-slate-900 font-bold">{currentIndex + 1}</strong> of{' '}
            <strong className="text-slate-900 font-bold">{queue.length}</strong>
          </span>

          {/* Card Type Badge */}
          <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-[#24389c] border border-indigo-100">
            {currentCard.type}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-[#24389c] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Flashcard Container */}
      <div className="relative bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-sm transition-all min-h-[400px] flex flex-col justify-between">
        
        {/* Card Header & Controls */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-[#24389c] border border-indigo-100">
                {currentCard.type === 'qa' && <BookOpen className="w-4 h-4" />}
                {currentCard.type === 'cloze' && <FileText className="w-4 h-4" />}
                {currentCard.type === 'code' && <Code2 className="w-4 h-4" />}
                {currentCard.type === 'mcq' && <CheckSquare className="w-4 h-4" />}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {currentCard.type === 'qa' && 'Question / Concept'}
                {currentCard.type === 'cloze' && 'Fill in the Blank'}
                {currentCard.type === 'code' && 'Code Analysis'}
                {currentCard.type === 'mcq' && 'Multiple Choice'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Text To Speech Audio */}
              <button
                onClick={() =>
                  handleSpeak(
                    isFlipped
                      ? `${currentCard.question}. Answer: ${currentCard.answer}`
                      : currentCard.question
                  )
                }
                className={`p-2 rounded-xl border transition-colors ${
                  isSpeaking
                    ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
                }`}
                title="Listen to card audio"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              {/* AI ELI5 Explanation Trigger */}
              <button
                onClick={handleFetchExplanation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-[#24389c] text-xs font-semibold transition-colors"
                title="Explain Like I'm 5"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">AI Explain</span>
              </button>
            </div>
          </div>

          {/* Question / Prompt Display */}
          <div className="space-y-4 mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {currentCard.type === 'cloze' && currentCard.clozeText
                ? renderClozeText(currentCard.clozeText, isFlipped)
                : currentCard.question}
            </h3>

            {/* Code Snippet Box */}
            {currentCard.codeSnippet && (
              <div className="p-4 rounded-2xl bg-slate-900 font-mono text-xs text-indigo-200 overflow-x-auto shadow-inner">
                <pre>{currentCard.codeSnippet}</pre>
              </div>
            )}

            {/* MCQ Option Buttons */}
            {currentCard.type === 'mcq' && currentCard.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                {currentCard.options.map((opt, idx) => {
                  const isCorrect = idx === currentCard.correctOptionIndex;
                  const isSelected = selectedMcqOption === idx;

                  let btnStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';
                  if (isFlipped) {
                    if (isCorrect) btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                    else if (isSelected && !isCorrect) btnStyle = 'bg-rose-50 border-rose-300 text-rose-900';
                  } else if (isSelected) {
                    btnStyle = 'bg-[#24389c] border-[#24389c] text-white font-semibold';
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isFlipped}
                      onClick={() => {
                        setSelectedMcqOption(idx);
                        if (isCorrect) {
                          setAiEvaluation({
                            score: 100,
                            isCorrect: true,
                            sm2Rating: 4,
                            ratingLabel: 'Easy',
                            feedback: 'Correct selection!',
                          });
                        } else {
                          setAiEvaluation({
                            score: 0,
                            isCorrect: false,
                            sm2Rating: 1,
                            ratingLabel: 'Again',
                            feedback: `Incorrect. Correct answer was: ${currentCard.answer}`,
                          });
                        }
                      }}
                      className={`p-3.5 rounded-xl border text-xs text-left transition-all font-medium ${btnStyle}`}
                    >
                      <span className="font-mono text-slate-400 mr-2 font-bold">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Answer Revealer or Free-Form Answer Box */}
          {!isFlipped && (
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer for instant AI evaluation, or reveal answer below..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-[#24389c] focus:ring-1 focus:ring-[#24389c] resize-none"
                />
                <button
                  id="btn_ai_grade_answer"
                  onClick={handleEvaluateAnswer}
                  disabled={isEvaluating || !userAnswer.trim()}
                  className="px-4 py-2 rounded-xl bg-[#24389c] hover:bg-[#1a2a7a] text-white font-semibold text-xs flex flex-col items-center justify-center gap-1 disabled:opacity-40 transition-all cursor-pointer flex-shrink-0 shadow-xs"
                >
                  {isEvaluating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 text-indigo-200" />
                  )}
                  <span>AI Grade</span>
                </button>
              </div>

              <button
                id="btn_flip_card"
                onClick={() => setIsFlipped(true)}
                className="w-full py-3.5 rounded-xl bg-[#3f51b5] hover:bg-[#24389c] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <RotateCw className="w-4 h-4 text-indigo-200" />
                <span>Show Answer (Space)</span>
              </button>
            </div>
          )}

          {/* Flipped Answer Area */}
          {isFlipped && (
            <div className="mt-6 p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in duration-200">
              
              {/* AI Evaluation Result Banner if user submitted an answer */}
              {aiEvaluation && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    aiEvaluation.isCorrect
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-sm">
                      {aiEvaluation.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-amber-600" />
                      )}
                      <span>AI Score: {aiEvaluation.score}%</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-white border border-slate-200">
                      Suggested: {aiEvaluation.ratingLabel}
                    </span>
                  </div>
                  <p className="leading-relaxed">{aiEvaluation.feedback}</p>
                </div>
              )}

              {/* Reference Answer */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Reference Answer
                </span>
                <p className="text-base font-bold text-slate-900 mt-1 leading-relaxed">
                  {currentCard.answer}
                </p>
              </div>

              {/* Explanation & Mnemonic */}
              {currentCard.explanation && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Key Insight / Explanation
                  </span>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    {currentCard.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rating Footer (Revealed after flip) */}
        {isFlipped && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-center font-medium text-slate-500 mb-4">
              How well did you recall this concept?
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                id="btn_rate_again"
                onClick={() => handleRateCard(1)}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-900 hover:text-rose-700 transition-all cursor-pointer group shadow-xs"
              >
                <span className="text-xs font-bold">1. Again</span>
                <span className="text-[10px] text-slate-500 group-hover:text-rose-600 mt-0.5 font-semibold">
                  {getNextIntervalText(currentCard, 1)}
                </span>
              </button>

              <button
                id="btn_rate_hard"
                onClick={() => handleRateCard(2)}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 transition-all cursor-pointer group shadow-xs"
              >
                <span className="text-xs font-bold">2. Hard</span>
                <span className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                  {getNextIntervalText(currentCard, 2)}
                </span>
              </button>

              <button
                id="btn_rate_good"
                onClick={() => handleRateCard(3)}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-900 hover:text-emerald-800 transition-all cursor-pointer group shadow-xs"
              >
                <span className="text-xs font-bold">3. Good</span>
                <span className="text-[10px] text-slate-500 group-hover:text-emerald-700 mt-0.5 font-semibold">
                  {getNextIntervalText(currentCard, 3)}
                </span>
              </button>

              <button
                id="btn_rate_easy"
                onClick={() => handleRateCard(4)}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-900 hover:text-[#24389c] transition-all cursor-pointer group shadow-xs"
              >
                <span className="text-xs font-bold">4. Easy</span>
                <span className="text-[10px] text-slate-500 group-hover:text-[#24389c] mt-0.5 font-semibold">
                  {getNextIntervalText(currentCard, 4)}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI ELI5 Explanation Modal Popover */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setShowExplanationModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300">
                <Lightbulb className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">AI ELI5 Tutor Explanation</h4>
                <p className="text-xs text-slate-400">Deep intuitive breakdown & mnemonic</p>
              </div>
            </div>

            {isExplaining ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
                <p className="text-xs">Generating real-world analogy and memory trick...</p>
              </div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto text-xs leading-relaxed space-y-3 text-slate-200 whitespace-pre-wrap p-3 bg-slate-950 rounded-2xl border border-slate-800">
                {aiExplanationText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
