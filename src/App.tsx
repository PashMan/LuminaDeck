import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DeckCard } from './components/DeckCard';
import { AIGeneratorModal } from './components/AIGeneratorModal';
import { StudySession } from './components/StudySession';
import { DeckDetailModal } from './components/DeckDetailModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ExportImportModal } from './components/ExportImportModal';
import { PricingModal } from './components/PricingModal';
import { ShortcutsModal } from './components/ShortcutsModal';

import { Deck, Flashcard, StudyStats } from './types';
import { getInitialDecks, saveDecks, getInitialStats, saveStats, logStudySession, exportDeckToAnkiTSV, downloadFile } from './lib/storage';
import { isCardDue } from './lib/sm2';

import { Plus, Sparkles, Search, Layers, Clock, CheckCircle2, Database, BookOpen, Crown, ArrowRight } from 'lucide-react';

export default function App() {
  const [decks, setDecks] = useState<Deck[]>(() => getInitialDecks());
  const [stats, setStats] = useState<StudyStats>(() => getInitialStats());

  const [activeTab, setActiveTab] = useState<'decks' | 'analytics' | 'export'>('decks');
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'mastered'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Modals and Sessions
  const [activeStudyDeck, setActiveStudyDeck] = useState<Deck | null>(null);
  const [selectedDeckForDetail, setSelectedDeckForDetail] = useState<Deck | null>(null);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [targetDeckForAI, setTargetDeckForAI] = useState<Deck | null>(null);

  // Synchronize state with localStorage
  useEffect(() => {
    saveDecks(decks);
  }, [decks]);

  // Handle Study Session Finish
  const handleFinishStudySession = (updatedCards: Flashcard[], sessionStats: { reviewed: number; correct: number }) => {
    if (!activeStudyDeck) return;

    // Update cards in current deck
    const updatedDecks = decks.map((d) => {
      if (d.id === activeStudyDeck.id) {
        return {
          ...d,
          cards: updatedCards,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });

    setDecks(updatedDecks);

    // Update study log stats and streak
    const newStats = logStudySession(sessionStats.reviewed, sessionStats.correct);
    setStats(newStats);

    // Exit study mode
    setActiveStudyDeck(null);
  };

  // Handle AI Card Generation Success
  const handleAIGenerationSuccess = (deckInfo: Partial<Deck>, generatedCards: Flashcard[]) => {
    if (targetDeckForAI) {
      // Append cards to existing deck
      const updatedDecks = decks.map((d) => {
        if (d.id === targetDeckForAI.id) {
          return {
            ...d,
            cards: [...d.cards, ...generatedCards],
            updatedAt: new Date().toISOString(),
          };
        }
        return d;
      });
      setDecks(updatedDecks);
    } else {
      // Create new deck
      const newDeck: Deck = {
        id: `deck_${Date.now()}`,
        title: deckInfo.title || 'AI Flashcards Deck',
        description: deckInfo.description || 'AI-generated micro-learning deck',
        icon: 'BrainCircuit',
        color: ['from-indigo-600 to-purple-600', 'from-blue-600 to-cyan-600', 'from-emerald-600 to-teal-600', 'from-rose-600 to-orange-600'][
          Math.floor(Math.random() * 4)
        ],
        tags: deckInfo.tags || ['AI'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cards: generatedCards,
      };

      setDecks([newDeck, ...decks]);
    }

    setTargetDeckForAI(null);
  };

  const handleDeleteDeck = (deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
  };

  const handleUpdateDeck = (updatedDeck: Deck) => {
    setDecks((prev) => prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)));
    if (selectedDeckForDetail?.id === updatedDeck.id) {
      setSelectedDeckForDetail(updatedDeck);
    }
  };

  const handleExportDeckTSV = (deck: Deck) => {
    const tsv = exportDeckToAnkiTSV(deck);
    downloadFile(`${deck.title.replace(/\s+/g, '_')}_anki.tsv`, tsv, 'text/tab-separated-values');
  };

  // Filter Decks
  const filteredDecks = decks.filter((deck) => {
    const matchesSearch =
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterMode === 'due') {
      return deck.cards.some(isCardDue);
    }
    if (filterMode === 'mastered') {
      const matureCount = deck.cards.filter((c) => c.interval >= 21).length;
      return matureCount > 0 && matureCount === deck.cards.length;
    }

    return true;
  });

  // Calculate global summary counters
  const totalCardsAll = decks.reduce((acc, d) => acc + d.cards.length, 0);
  const totalDueAll = decks.reduce((acc, d) => acc + d.cards.filter(isCardDue).length, 0);

  // If in active study session, render StudySession
  if (activeStudyDeck) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <StudySession
          deck={activeStudyDeck}
          onFinish={handleFinishStudySession}
          onBack={() => setActiveStudyDeck(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-slate-900 flex flex-col font-sans selection:bg-[#24389c] selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        stats={stats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAIGenerator={() => {
          setTargetDeckForAI(null);
          setIsAIGeneratorOpen(true);
        }}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'analytics' && <AnalyticsDashboard decks={decks} stats={stats} />}

        {activeTab === 'export' && (
          <ExportImportModal
            decks={decks}
            onImportDeck={(newDeck) => setDecks([newDeck, ...decks])}
          />
        )}

        {activeTab === 'decks' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* Header / Overview Hero Section in Lumina AI design */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[#24389c] text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-[#24389c]" />
                  <span>AI Flashcards & Spaced Repetition Engine</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Flashcard Workspace
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Convert lectures, notes, PDFs, and documentation into active recall flashcards. Optimized by SuperMemo SM-2 for exponential memory retention.
                </p>

                {/* Quick Metrics Bar */}
                <div className="pt-1 flex flex-wrap gap-3 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <Database className="w-3.5 h-3.5 text-[#24389c]" />
                    <span>{decks.length} Decks ({totalCardsAll} cards)</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-800">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{totalDueAll} Due Today</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setTargetDeckForAI(null);
                    setIsAIGeneratorOpen(true);
                  }}
                  className="px-5 py-3 rounded-xl bg-[#24389c] hover:bg-[#1a2a7a] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Generate AI Deck</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Controls Bar: Search & Filter Tabs */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter decks or tags..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-[#24389c] focus:ring-1 focus:ring-[#24389c] shadow-xs"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl border border-slate-200/80 w-full sm:w-auto">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterMode === 'all'
                      ? 'bg-white text-[#24389c] shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({decks.length})
                </button>

                <button
                  onClick={() => setFilterMode('due')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterMode === 'due'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Due Today ({decks.filter((d) => d.cards.some(isCardDue)).length})
                </button>

                <button
                  onClick={() => setFilterMode('mastered')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterMode === 'mastered'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mastered
                </button>
              </div>
            </div>

            {/* Deck Cards Grid */}
            {filteredDecks.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-4 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No decks found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Create your first AI flashcard deck using topic keywords or study notes.
                </p>
                <button
                  onClick={() => {
                    setTargetDeckForAI(null);
                    setIsAIGeneratorOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#24389c] hover:bg-[#1a2a7a] text-white text-xs font-semibold inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Generate Deck Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDecks.map((deck) => (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    onStudy={(d) => setActiveStudyDeck(d)}
                    onManage={(d) => setSelectedDeckForDetail(d)}
                    onExport={(d) => handleExportDeckTSV(d)}
                    onDelete={(id) => handleDeleteDeck(id)}
                    onAddAICards={(d) => {
                      setTargetDeckForAI(d);
                      setIsAIGeneratorOpen(true);
                    }}
                  />
                ))}
              </div>
            )}

          </div>
        )}
      </main>

      {/* AI Generator Modal */}
      <AIGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => {
          setIsAIGeneratorOpen(false);
          setTargetDeckForAI(null);
        }}
        onSuccess={handleAIGenerationSuccess}
        targetExistingDeck={targetDeckForAI}
      />

      {/* Deck Detail / Editor Modal */}
      <DeckDetailModal
        deck={selectedDeckForDetail}
        isOpen={!!selectedDeckForDetail}
        onClose={() => setSelectedDeckForDetail(null)}
        onUpdateDeck={handleUpdateDeck}
        onOpenAIGeneratorForDeck={(d) => {
          setSelectedDeckForDetail(null);
          setTargetDeckForAI(d);
          setIsAIGeneratorOpen(true);
        }}
      />

      {/* Pricing Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />

      {/* Shortcuts Guide Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

    </div>
  );
}
