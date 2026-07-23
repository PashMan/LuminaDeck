import React, { useState } from 'react';
import { Play, Layers, Clock, MoreVertical, Sparkles, Trash2, Download, Edit3, CheckCircle2 } from 'lucide-react';
import { Deck } from '../types';
import { isCardDue, getCardStatus } from '../lib/sm2';

interface DeckCardProps {
  deck: Deck;
  onStudy: (deck: Deck) => void;
  onManage: (deck: Deck) => void;
  onExport: (deck: Deck) => void;
  onDelete: (deckId: string) => void;
  onAddAICards: (deck: Deck) => void;
}

export const DeckCard: React.FC<DeckCardProps> = ({
  deck,
  onStudy,
  onManage,
  onExport,
  onDelete,
  onAddAICards,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const dueCards = deck.cards.filter(isCardDue);
  const matureCards = deck.cards.filter((c) => getCardStatus(c) === 'mature');
  const totalCount = deck.cards.length;
  const progressPercent = totalCount > 0 ? Math.round((matureCards.length / totalCount) * 100) : 0;

  return (
    <div
      id={`deck_card_${deck.id}`}
      className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#24389c] font-semibold text-base shadow-xs">
              <Layers className="w-5 h-5 text-[#24389c]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-[#24389c] transition-colors line-clamp-1">
                {deck.title}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{totalCount} cards</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">{progressPercent}% Mastered</span>
              </p>
            </div>
          </div>

          {/* Context Menu Dropdown */}
          <div className="relative">
            <button
              id={`deck_menu_btn_${deck.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-8 z-20 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 text-xs text-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onManage(deck);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-left font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#24389c]" />
                  <span>Browse & Edit Cards</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onAddAICards(deck);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-left font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Generate More Cards</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onExport(deck);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-left font-medium"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export to Anki TSV</span>
                </button>

                <hr className="my-1 border-slate-100" />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (confirm(`Are you sure you want to delete deck "${deck.title}"?`)) {
                      onDelete(deck.id);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 text-left font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Deck</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {deck.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {deck.tags.slice(0, 4).map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div>
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#24389c] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs">
            {dueCards.length > 0 ? (
              <span className="text-amber-800 font-semibold flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {dueCards.length} due today
              </span>
            ) : (
              <span className="text-emerald-800 font-semibold flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                All reviewed!
              </span>
            )}
          </div>

          <button
            id={`btn_study_deck_${deck.id}`}
            onClick={() => onStudy(deck)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#24389c] hover:bg-[#1a2a7a] text-white transition-all cursor-pointer shadow-xs hover:-translate-y-0.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{dueCards.length > 0 ? 'Review Due' : 'Study Deck'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

