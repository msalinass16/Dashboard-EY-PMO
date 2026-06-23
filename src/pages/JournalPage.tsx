import { useState } from 'react';
import { clsx } from 'clsx';
import { Plus, Trash2, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { useJournal } from '@/hooks/useJournal';
import { Card } from '@/components/ui/Card';
import { HOLDINGS } from '@/data/holdings';
import type { JournalEntry, JournalAction } from '@/types';

const ACTION_COLORS: Record<JournalAction, string> = {
  BUY: 'text-gain bg-gain/10',
  SELL: 'text-loss bg-loss/10',
  WATCH: 'text-accent bg-accent/10',
  NOTE: 'text-slate-400 bg-slate-400/10',
};

const CONVICTION_COLORS = [
  'text-loss', 'text-loss', 'text-loss', 'text-loss',
  'text-gold', 'text-gold', 'text-gold',
  'text-gain', 'text-gain', 'text-gain',
];

const PORTFOLIO_TICKERS = HOLDINGS.map((h) => h.ticker);

interface EntryCardProps {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}

function EntryCard({ entry, onDelete }: EntryCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-bg-secondary/60 rounded-xl border border-border/40 overflow-hidden">
      <div
        className="flex items-start justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-surface-raised transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={clsx('text-2xs font-bold px-2 py-0.5 rounded uppercase shrink-0', ACTION_COLORS[entry.action])}>
            {entry.action}
          </span>
          <span className="font-semibold font-mono text-accent text-sm shrink-0">{entry.ticker}</span>
          {entry.price != null && (
            <span className="text-xs font-mono text-slate-500 shrink-0">@ ${entry.price.toFixed(2)}</span>
          )}
          <span className="text-xs text-slate-400 truncate hidden sm:block">{entry.thesis}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-2xs text-slate-600">Conviction</span>
            <span className={clsx('text-sm font-bold font-mono', CONVICTION_COLORS[entry.conviction - 1])}>
              {entry.conviction}/10
            </span>
          </div>
          <span className="text-2xs text-slate-600">{entry.date}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border/40 space-y-3">
          {entry.thesis && (
            <div>
              <div className="text-2xs text-slate-500 uppercase tracking-wide mb-1">Investment Thesis</div>
              <p className="text-xs text-slate-300 leading-relaxed">{entry.thesis}</p>
            </div>
          )}
          {entry.catalysts && (
            <div>
              <div className="text-2xs text-slate-500 uppercase tracking-wide mb-1">Catalysts</div>
              <p className="text-xs text-slate-400 leading-relaxed">{entry.catalysts}</p>
            </div>
          )}
          {entry.risks && (
            <div>
              <div className="text-2xs text-slate-500 uppercase tracking-wide mb-1">Risks</div>
              <p className="text-xs text-slate-400 leading-relaxed">{entry.risks}</p>
            </div>
          )}
          {entry.expectedReturn != null && (
            <div className="flex items-center gap-2">
              <span className="text-2xs text-slate-500">Expected Return:</span>
              <span className={clsx('text-xs font-mono font-medium', entry.expectedReturn >= 0 ? 'text-gain' : 'text-loss')}>
                {entry.expectedReturn > 0 ? '+' : ''}{entry.expectedReturn.toFixed(1)}%
              </span>
            </div>
          )}
          {entry.outcome && (
            <div>
              <div className="text-2xs text-slate-500 uppercase tracking-wide mb-1">Outcome / Notes</div>
              <p className="text-xs text-slate-400 leading-relaxed">{entry.outcome}</p>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
              className="flex items-center gap-1 text-2xs text-slate-600 hover:text-loss transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const BLANK: Omit<JournalEntry, 'id'> = {
  date: new Date().toISOString().slice(0, 10),
  ticker: '',
  action: 'BUY',
  price: undefined,
  thesis: '',
  catalysts: '',
  risks: '',
  expectedReturn: undefined,
  conviction: 5,
  outcome: '',
};

function Input({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-2xs text-slate-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent/50"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 3, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-2xs text-slate-500 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent/50 resize-none"
      />
    </div>
  );
}

export function JournalPage() {
  const { entries, add, remove } = useJournal();
  const [draft, setDraft] = useState({ ...BLANK });
  const [showForm, setShowForm] = useState(false);
  const [filterTicker, setFilterTicker] = useState('');

  function field<K extends keyof typeof BLANK>(k: K, v: (typeof BLANK)[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function handleSave() {
    if (!draft.ticker.trim() || !draft.thesis.trim()) return;
    add({
      ...draft,
      ticker: draft.ticker.toUpperCase(),
      price: draft.price != null && !isNaN(draft.price as number) ? draft.price : undefined,
      expectedReturn: draft.expectedReturn != null && !isNaN(draft.expectedReturn as number) ? draft.expectedReturn : undefined,
    });
    setDraft({ ...BLANK });
    setShowForm(false);
  }

  const filtered = filterTicker
    ? entries.filter((e) => e.ticker === filterTicker.toUpperCase())
    : entries;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <select
            value={filterTicker}
            onChange={(e) => setFilterTicker(e.target.value)}
            className="bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-accent/50"
          >
            <option value="">All tickers</option>
            {[...new Set([...PORTFOLIO_TICKERS, ...entries.map((e) => e.ticker)])].sort().map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span className="text-2xs text-slate-600">{filtered.length} entries</span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 bg-accent/20 hover:bg-accent/30 text-accent px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          {showForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'New Entry'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <Card title="New Journal Entry">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input label="Date" value={draft.date} onChange={(v) => field('date', v)} type="date" />
              <div>
                <label className="block text-2xs text-slate-500 mb-1">Ticker</label>
                <input
                  value={draft.ticker}
                  onChange={(e) => field('ticker', e.target.value.toUpperCase())}
                  placeholder="e.g. NVDA"
                  list="portfolio-tickers"
                  className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent/50"
                />
                <datalist id="portfolio-tickers">
                  {PORTFOLIO_TICKERS.map((t) => <option key={t} value={t} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-2xs text-slate-500 mb-1">Action</label>
                <select
                  value={draft.action}
                  onChange={(e) => field('action', e.target.value as JournalAction)}
                  className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-accent/50"
                >
                  {(['BUY', 'SELL', 'WATCH', 'NOTE'] as JournalAction[]).map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <Input label="Price (opt.)" value={draft.price != null ? String(draft.price) : ''} onChange={(v) => field('price', v ? parseFloat(v) as unknown as undefined : undefined)} type="number" placeholder="0.00" />
            </div>
            <Textarea label="Investment Thesis *" value={draft.thesis} onChange={(v) => field('thesis', v)} rows={3} placeholder="Why are you making this investment decision?" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Textarea label="Catalysts" value={draft.catalysts ?? ''} onChange={(v) => field('catalysts', v)} rows={2} placeholder="What could drive the thesis?" />
              <Textarea label="Risks" value={draft.risks ?? ''} onChange={(v) => field('risks', v)} rows={2} placeholder="What could go wrong?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Expected Return (%)" value={draft.expectedReturn != null ? String(draft.expectedReturn) : ''} onChange={(v) => field('expectedReturn', v ? parseFloat(v) as unknown as undefined : undefined)} type="number" placeholder="e.g. 25" />
              <div>
                <label className="block text-2xs text-slate-500 mb-1">Conviction (1-10): {draft.conviction}</label>
                <input
                  type="range" min={1} max={10} value={draft.conviction}
                  onChange={(e) => field('conviction', parseInt(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-slate-500 hover:text-slate-200 transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={!draft.ticker.trim() || !draft.thesis.trim()}
                className="px-4 py-2 bg-accent/20 hover:bg-accent/30 text-accent text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Entry
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Journal entries */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-600 text-sm">
          {filterTicker ? `No entries for ${filterTicker}` : 'No journal entries yet. Start documenting your investment decisions.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onDelete={remove} />
          ))}
        </div>
      )}
    </div>
  );
}
