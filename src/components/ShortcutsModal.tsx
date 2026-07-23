import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Flip flashcard / reveal answer' },
    { key: '1', desc: 'Again (Reset interval, review immediately)' },
    { key: '2', desc: 'Hard (Slightly shorter interval multiplier)' },
    { key: '3', desc: 'Good (Standard SM-2 spacing interval)' },
    { key: '4', desc: 'Easy (Long interval multiplier)' },
    { key: 'Ctrl + Enter', desc: 'Submit AI semantic answer evaluation' },
    { key: 'Esc', desc: 'Exit study session / close modals' },
  ];

  return (
    <div id="shortcuts_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-slate-200/80 rounded-3xl shadow-xl p-6 text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#24389c]" />
            <h3 className="font-bold text-base text-slate-900">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="py-4 space-y-3">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
              <span className="text-slate-700 font-medium">{s.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[#24389c] font-mono text-[11px] font-bold shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-2 text-center text-[11px] text-slate-500 font-medium">
          SuperMemo SM-2 keys standard mapped for fast Anki workflow.
        </div>

      </div>
    </div>
  );
};
