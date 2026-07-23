import React, { useState } from 'react';
import { X, Search, Plus, Trash2, Edit3, Sparkles, Download, Layers, BookOpen, Code2, FileText, CheckSquare, Save } from 'lucide-react';
import { Deck, Flashcard, CardType } from '../types';
import { exportDeckToAnkiTSV, downloadFile } from '../lib/storage';

interface DeckDetailModalProps {
  deck: Deck | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateDeck: (updatedDeck: Deck) => void;
  onOpenAIGeneratorForDeck: (deck: Deck) => void;
}

export const DeckDetailModal: React.FC<DeckDetailModalProps> = ({
  deck,
  isOpen,
  onClose,
  onUpdateDeck,
  onOpenAIGeneratorForDeck,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Manual card creation form
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [newCardType, setNewCardType] = useState<CardType>('qa');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newExplanation, setNewExplanation] = useState('');

  if (!isOpen || !deck) return null;

  const filteredCards = deck.cards.filter((card) => {
    const q = searchQuery.toLowerCase();
    return (
      card.question.toLowerCase().includes(q) ||
      card.answer.toLowerCase().includes(q) ||
      card.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleDeleteCard = (cardId: string) => {
    const updatedCards = deck.cards.filter((c) => c.id !== cardId);
    onUpdateDeck({ ...deck, cards: updatedCards, updatedAt: new Date().toISOString() });
  };

  const handleAddManualCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const newCard: Flashcard = {
      id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: newCardType,
      question: newQuestion,
      answer: newAnswer,
      explanation: newExplanation,
      tags: deck.tags || ['custom'],
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
      dueDate: new Date().toISOString(),
      lastReviewedAt: null,
      history: [],
    };

    onUpdateDeck({
      ...deck,
      cards: [...deck.cards, newCard],
      updatedAt: new Date().toISOString(),
    });

    setNewQuestion('');
    setNewAnswer('');
    setNewExplanation('');
    setShowAddCardForm(false);
  };

  const handleExportAnki = () => {
    const tsv = exportDeckToAnkiTSV(deck);
    downloadFile(`${deck.title.replace(/\s+/g, '_')}_anki.tsv`, tsv, 'text/tab-separated-values');
  };

  return (
    <div id="deck_detail_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200/80 rounded-3xl shadow-xl p-6 sm:p-8 text-slate-900 my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${deck.color || 'from-[#24389c] to-[#3f51b5]'} text-white shadow-xs`}>
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{deck.title}</h2>
              <p className="text-xs font-semibold text-slate-500">{deck.cards.length} Total Flashcards</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAIGeneratorForDeck(deck)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#24389c] hover:bg-[#1a2a7a] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>AI Add Cards</span>
            </button>

            <button
              onClick={handleExportAnki}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
              title="Export Anki TSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Anki TSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search and Manual Add */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards in deck..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-[#24389c]"
            />
          </div>

          <button
            onClick={() => setShowAddCardForm(!showAddCardForm)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors"
          >
            <Plus className="w-4 h-4 text-[#24389c]" />
            <span>{showAddCardForm ? 'Cancel Add' : 'Add Card Manually'}</span>
          </button>
        </div>

        {/* Manual Add Card Form */}
        {showAddCardForm && (
          <form onSubmit={handleAddManualCard} className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3 mb-4 text-xs">
            <h4 className="font-bold text-[#24389c]">Create Custom Card</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Question / Prompt</label>
                <input
                  type="text"
                  required
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g. What is WAL in PostgreSQL?"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#24389c]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Reference Answer</label>
                <input
                  type="text"
                  required
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="e.g. Write-Ahead Logging ensures ACID durability."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#24389c]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Explanation / Insight (Optional)</label>
              <input
                type="text"
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                placeholder="Brief memory trick or context..."
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#24389c]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#24389c] hover:bg-[#1a2a7a] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Card</span>
              </button>
            </div>
          </form>
        )}

        {/* Card List Container */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredCards.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No cards found matching your search.
            </div>
          ) : (
            filteredCards.map((card, idx) => (
              <div
                key={card.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-50 text-[#24389c] border border-indigo-100">
                      {card.type}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Interval: {card.interval}d | Reps: {card.repetitions}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900">{card.question}</p>
                  <p className="text-emerald-700 font-medium">{card.answer}</p>
                  {card.explanation && (
                    <p className="text-[11px] text-slate-500 italic">{card.explanation}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors self-end sm:self-center"
                  title="Delete Card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
