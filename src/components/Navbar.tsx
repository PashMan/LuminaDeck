import React, { useState } from 'react';
import { Sparkles, Flame, Plus, BarChart2, Download, Layers, Crown, Keyboard, Brain, Menu, X } from 'lucide-react';
import { StudyStats } from '../types';

interface NavbarProps {
  stats: StudyStats;
  activeTab: 'decks' | 'analytics' | 'export';
  setActiveTab: (tab: 'decks' | 'analytics' | 'export') => void;
  onOpenAIGenerator: () => void;
  onOpenPricing: () => void;
  onOpenShortcuts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  activeTab,
  setActiveTab,
  onOpenAIGenerator,
  onOpenPricing,
  onOpenShortcuts,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header id="app_header" className="sticky top-0 z-30 bg-[#f8fafc]/95 backdrop-blur-md border-b border-slate-200/80 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Main Bar */}
        <div className="h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0" 
            onClick={() => setActiveTab('decks')}
          >
            <div className="w-9 h-9 rounded-xl bg-[#24389c] flex items-center justify-center text-white shadow-xs">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-[#24389c]">
                  LuminaDeck
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 text-[#24389c] border border-indigo-100 hidden sm:inline-block">
                  SM-2
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 hidden md:block">Micro-Learning & Active Recall</span>
            </div>
          </div>

          {/* Desktop Center Nav Tabs (hidden on mobile, shown on md+) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl border border-slate-200/80">
            <button
              id="nav_tab_decks"
              onClick={() => setActiveTab('decks')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'decks'
                  ? 'bg-white text-[#24389c] shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-4 h-4 text-[#24389c]" />
              <span>Decks</span>
            </button>

            <button
              id="nav_tab_analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-[#24389c] shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-[#24389c]" />
              <span>Analytics</span>
            </button>

            <button
              id="nav_tab_export"
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'export'
                  ? 'bg-white text-[#24389c] shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Download className="w-4 h-4 text-[#24389c]" />
              <span>Anki Export</span>
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Keyboard Shortcuts Button */}
            <button
              onClick={onOpenShortcuts}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-xs transition-colors hidden lg:flex items-center justify-center"
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Pro Plan Upgrade */}
            <button
              onClick={onOpenPricing}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 font-semibold text-xs transition-colors"
              title="View Pro Plans"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-600/20" />
              <span>Pro</span>
            </button>

            {/* Streak Counter */}
            <div
              id="streak_counter_badge"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-amber-600 font-bold text-xs shadow-xs"
              title={`${stats.streakDays} Day Learning Streak`}
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{stats.streakDays}d</span>
            </div>

            {/* Primary Action Button */}
            <button
              id="btn_open_ai_generator"
              onClick={onOpenAIGenerator}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#24389c] hover:bg-[#1a2a7a] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-200" />
              <span className="hidden sm:inline">Create</span>
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs md:hidden flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Sub-Navigation Bar (visible on mobile below top row) */}
        <div className="md:hidden pb-3.5 pt-0 flex items-center justify-between gap-1 border-t border-slate-200/60 pt-2">
          <div className="flex items-center gap-1 w-full bg-slate-200/60 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('decks')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'decks'
                  ? 'bg-white text-[#24389c] shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#24389c]" />
              <span>Decks</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-[#24389c] shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#24389c]" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'export'
                  ? 'bg-white text-[#24389c] shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-[#24389c]" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel for extra controls */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200/80 flex flex-col gap-2 bg-slate-50 rounded-b-xl px-2 mb-2">
            <button
              onClick={() => {
                onOpenPricing();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium text-xs border border-amber-200"
            >
              <Crown className="w-4 h-4 text-amber-600" />
              <span>Upgrade to Pro Plan</span>
            </button>

            <button
              onClick={() => {
                onOpenShortcuts();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200"
            >
              <Keyboard className="w-4 h-4 text-slate-500" />
              <span>Keyboard Shortcuts</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
};


