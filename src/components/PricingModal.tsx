import React from 'react';
import { X, Check, Sparkles, Zap, ShieldCheck, Crown, ArrowRight } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div id="pricing_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200/80 rounded-3xl shadow-xl p-6 sm:p-8 text-slate-900 my-8">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center max-w-lg mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[#24389c] text-xs font-semibold">
            <Crown className="w-3.5 h-3.5 text-[#24389c]" />
            <span>MemPulse Pro Startup Plan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Master 3x Faster with Unlimited AI Flashcards
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Save up to 15 hours every month by automating Anki card creation and semantic grading.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Free Tier */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-900">Free Starter</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-semibold">Basic</span>
              </div>
              <div className="text-3xl font-black text-slate-900 mb-4">
                $0 <span className="text-xs font-normal text-slate-500">/ forever</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Up to 3 AI-generated decks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>SuperMemo SM-2 Spaced Repetition</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Standard Anki TSV Export</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="line-through">AI Semantic Answer Grading</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="line-through">Unlimited PDF/Doc Notes Uploads</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
            >
              Current Plan
            </button>
          </div>

          {/* Pro Tier (Popular) */}
          <div className="relative p-6 rounded-2xl bg-white border-2 border-[#24389c] shadow-lg flex flex-col justify-between">
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-[#24389c] text-white font-extrabold text-[10px] tracking-wider uppercase shadow-xs">
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>MemPulse Pro</span>
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-[#24389c] font-bold">
                  Unlimited
                </span>
              </div>

              <div className="text-3xl font-black text-slate-900 mb-1">
                $12 <span className="text-xs font-normal text-slate-500">/ month</span>
              </div>
              <p className="text-[11px] text-[#24389c] font-semibold mb-4">Billed annually ($99/yr) • 7-day free trial</p>

              <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-bold text-slate-900">Unlimited AI Card Generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Real-time Semantic Answer Evaluation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>AI ELI5 Tutor & Mnemonic Explanations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Paste full PDFs, Docs, & Code Repos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>1-Click Anki Sync & Audio TTS Pronunciation</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                alert('Thank you for trying MemPulse Pro! You are now in Pro Demo Mode.');
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-[#24389c] hover:bg-[#1a2a7a] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start 7-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Security & Guarantee Trust Banner */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cancel anytime with 1-click</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#24389c]" />
            <span>Instant Anki APKG / TSV export</span>
          </div>
        </div>

      </div>
    </div>
  );
};
