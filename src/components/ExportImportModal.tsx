import React, { useState } from 'react';
import { Download, Upload, FileText, Check, Copy, Layers, FileSpreadsheet } from 'lucide-react';
import { Deck } from '../types';
import { exportDeckToAnkiTSV, downloadFile } from '../lib/storage';

interface ExportImportModalProps {
  decks: Deck[];
  onImportDeck: (importedDeck: Deck) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ decks, onImportDeck }) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || '');
  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const selectedDeck = decks.find((d) => d.id === selectedDeckId) || decks[0];

  const handleExportTSV = () => {
    if (!selectedDeck) return;
    const tsv = exportDeckToAnkiTSV(selectedDeck);
    downloadFile(`${selectedDeck.title.replace(/\s+/g, '_')}_anki.tsv`, tsv, 'text/tab-separated-values');
  };

  const handleCopyTSV = () => {
    if (!selectedDeck) return;
    const tsv = exportDeckToAnkiTSV(selectedDeck);
    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    if (!selectedDeck) return;
    const content = JSON.stringify(selectedDeck, null, 2);
    downloadFile(`${selectedDeck.title.replace(/\s+/g, '_')}_backup.json`, content, 'application/json');
  };

  const handleImportJSON = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    setImportSuccess('');

    try {
      if (!jsonText.trim()) {
        setImportError('Please paste valid JSON content.');
        return;
      }
      const parsed = JSON.parse(jsonText);
      if (!parsed.title || !Array.isArray(parsed.cards)) {
        throw new Error('Invalid deck JSON structure. Must include "title" and "cards" array.');
      }

      const newDeck: Deck = {
        id: `deck_imp_${Date.now()}`,
        title: parsed.title,
        description: parsed.description || 'Imported deck',
        icon: parsed.icon || 'Database',
        color: parsed.color || 'from-indigo-600 to-purple-600',
        tags: parsed.tags || ['Imported'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cards: parsed.cards.map((c: any, i: number) => ({
          id: `card_${Date.now()}_${i}`,
          type: c.type || 'qa',
          question: c.question || 'Question',
          answer: c.answer || 'Answer',
          explanation: c.explanation || '',
          tags: c.tags || [],
          repetitions: c.repetitions || 0,
          interval: c.interval || 0,
          easeFactor: c.easeFactor || 2.5,
          dueDate: c.dueDate || new Date().toISOString(),
          lastReviewedAt: null,
          history: [],
        })),
      };

      onImportDeck(newDeck);
      setImportSuccess(`Successfully imported "${newDeck.title}" with ${newDeck.cards.length} cards!`);
      setJsonText('');
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse JSON.');
    }
  };

  return (
    <div id="export_import_view" className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-slate-900">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Anki Export & Backup Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Export decks directly to Anki TSV format, copy flashcard text, or import custom JSON decks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export Box */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">Export to Anki (TSV / CSV)</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Deck to Export</label>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#24389c]"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.cards.length} cards)
                </option>
              ))}
            </select>
          </div>

          {selectedDeck && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <p className="font-bold text-slate-900">{selectedDeck.title}</p>
              <p className="text-slate-600 line-clamp-2">{selectedDeck.description}</p>
              <div className="text-[11px] text-emerald-700 font-mono font-bold pt-1">
                Anki format: Front \t Back \t Tags
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleExportTSV}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Anki TSV</span>
            </button>

            <button
              onClick={handleCopyTSV}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#24389c]" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>
        </div>

        {/* Import Box */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#24389c]" />
            <h3 className="font-bold text-base text-slate-900">Import Custom Deck (JSON)</h3>
          </div>

          {importError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {importError}
            </div>
          )}

          {importSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              {importSuccess}
            </div>
          )}

          <form onSubmit={handleImportJSON} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Paste Deck JSON</label>
              <textarea
                rows={5}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='{ "title": "My Deck", "cards": [ { "question": "...", "answer": "..." } ] }'
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono placeholder-slate-400 focus:outline-none focus:border-[#24389c] resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#24389c] hover:bg-[#1a2a7a] text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4 text-indigo-200" />
              <span>Import Deck Now</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
