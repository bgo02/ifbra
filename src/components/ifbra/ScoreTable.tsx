import { ITEMS, DOMAINS, type ScoreValue, type ScoreOrigin } from '@/lib/ifbra-types';
import { calculateDomainTotal } from '@/lib/ifbra-engine';
import { Badge } from '@/components/ui/badge';

interface ScoreTableProps {
  scores: Record<string, number>;
  origins: Record<string, ScoreOrigin>;
  onScoreChange?: (itemId: string, score: ScoreValue) => void;
  readOnly?: boolean;
  fuzzyScores?: Record<string, number>;
  showFuzzyDiff?: boolean;
  label: string;
}

const SCORE_OPTIONS: ScoreValue[] = [25, 50, 75, 100];

export default function ScoreTable({ scores, origins, onScoreChange, readOnly, fuzzyScores, showFuzzyDiff, label }: ScoreTableProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-primary/5 px-4 py-2 font-semibold text-sm">{label}</div>
      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="border-b border-border text-left">
              <th className="px-3 py-2 w-12">Item</th>
              <th className="px-3 py-2">Atividade</th>
              <th className="px-3 py-2 w-24 text-center">Pontuação</th>
              {showFuzzyDiff && <th className="px-3 py-2 w-20 text-center">Fuzzy</th>}
              <th className="px-3 py-2 w-20 text-center">Origem</th>
            </tr>
          </thead>
          {DOMAINS.map(domain => {
            const domainItems = ITEMS.filter(i => i.domainId === domain.id);
            const domainTotal = calculateDomainTotal(scores, domain.id);
            const fuzzyDomainTotal = fuzzyScores ? calculateDomainTotal(fuzzyScores, domain.id) : domainTotal;
            return (
              <tbody key={domain.id}>
                <tr className="bg-muted/50">
                  <td colSpan={showFuzzyDiff ? 4 : 3} className="px-3 py-1.5 font-semibold text-xs text-muted-foreground">
                    {domain.id}. {domain.name}
                  </td>
                  <td className="px-3 py-1.5 text-xs font-semibold text-center text-muted-foreground">
                    {domainTotal}
                    {showFuzzyDiff && fuzzyDomainTotal !== domainTotal && (
                      <span className="text-accent"> → {fuzzyDomainTotal}</span>
                    )}
                  </td>
                </tr>
                {domainItems.map(item => {
                  const score = scores[item.id];
                  const fuzzyScore = fuzzyScores?.[item.id];
                  const changed = showFuzzyDiff && fuzzyScore !== undefined && fuzzyScore !== score;
                  const origin = origins[item.id] || 'manual';
                  return (
                    <tr key={item.id} className={`border-b border-border/50 ${changed ? 'bg-accent/5' : ''}`}>
                      <td className="px-3 py-1.5 text-muted-foreground font-mono text-xs">{item.id}</td>
                      <td className="px-3 py-1.5 text-xs">{item.name}</td>
                      <td className="px-3 py-1.5 text-center">
                        {readOnly ? (
                          <span className="font-mono text-sm font-semibold">{score ?? '—'}</span>
                        ) : (
                          <select
                            value={score ?? ''}
                            onChange={(e) => onScoreChange?.(item.id, parseInt(e.target.value) as ScoreValue)}
                            className="w-16 px-1.5 py-0.5 text-sm border border-input rounded bg-card text-foreground font-mono"
                          >
                            <option value="">—</option>
                            {SCORE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        )}
                      </td>
                      {showFuzzyDiff && (
                        <td className="px-3 py-1.5 text-center">
                          {changed ? (
                            <span className="font-mono text-sm font-bold text-accent">{fuzzyScore}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-3 py-1.5 text-center">
                        <Badge variant={origin === 'extracted' ? 'default' : origin === 'edited' ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0">
                          {origin === 'extracted' ? 'PDF' : origin === 'edited' ? 'Edit' : 'Manual'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>
    </div>
  );
}
