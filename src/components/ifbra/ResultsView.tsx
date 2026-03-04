import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type AuditTrail, type ClassificationRanges, type ScoreDistribution, DOMAINS } from '@/lib/ifbra-types';
import { Settings2 } from 'lucide-react';
import { useState } from 'react';

interface ResultsViewProps {
  audit: AuditTrail;
  ranges: ClassificationRanges;
  onRangesChange: (ranges: ClassificationRanges) => void;
  onBack: () => void;
  onNext: () => void;
}

function DistTable({ label, orig, fuzzy }: { label: string; orig: ScoreDistribution; fuzzy: ScoreDistribution }) {
  const rows = [
    { label: 'Pontuação 25', oc: orig.count25, op: orig.points25, fc: fuzzy.count25, fp: fuzzy.points25 },
    { label: 'Pontuação 50', oc: orig.count50, op: orig.points50, fc: fuzzy.count50, fp: fuzzy.points50 },
    { label: 'Pontuação 75', oc: orig.count75, op: orig.points75, fc: fuzzy.count75, fp: fuzzy.points75 },
    { label: 'Pontuação 100', oc: orig.count100, op: orig.points100, fc: fuzzy.count100, fp: fuzzy.points100 },
  ];
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-primary/5 px-4 py-2 font-semibold text-sm">{label}</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-3 py-2"></th>
            <th className="px-3 py-2 text-center" colSpan={2}>Perícia</th>
            <th className="px-3 py-2 text-center" colSpan={2}>Matriz Fuzzy</th>
          </tr>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="px-3 py-1"></th>
            <th className="px-3 py-1 text-center">Itens</th>
            <th className="px-3 py-1 text-center">Pontos</th>
            <th className="px-3 py-1 text-center">Itens</th>
            <th className="px-3 py-1 text-center">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.label} className="border-b border-border/50">
              <td className="px-3 py-1.5 font-medium text-xs">{r.label}</td>
              <td className="px-3 py-1.5 text-center font-mono">{r.oc}</td>
              <td className="px-3 py-1.5 text-center font-mono">{r.op.toLocaleString('pt-BR')}</td>
              <td className="px-3 py-1.5 text-center font-mono">{r.fc}</td>
              <td className="px-3 py-1.5 text-center font-mono">{r.fp.toLocaleString('pt-BR')}</td>
            </tr>
          ))}
          <tr className="bg-muted/30 font-semibold">
            <td className="px-3 py-2 text-xs">TOTAL</td>
            <td className="px-3 py-2 text-center font-mono">41</td>
            <td className="px-3 py-2 text-center font-mono">{orig.total.toLocaleString('pt-BR')}</td>
            <td className="px-3 py-2 text-center font-mono">41</td>
            <td className="px-3 py-2 text-center font-mono">{fuzzy.total.toLocaleString('pt-BR')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function classColor(cls: string) {
  if (cls === 'Grave') return 'text-destructive';
  if (cls === 'Moderada') return 'text-warning';
  if (cls === 'Leve') return 'text-accent';
  return 'text-muted-foreground';
}

export default function ResultsView({ audit, ranges, onRangesChange, onBack, onNext }: ResultsViewProps) {
  const [showParams, setShowParams] = useState(false);
  const changed = audit.combinedOriginal !== audit.combinedFuzzy;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Social (Perícia)</div>
            <div className="text-lg font-bold font-mono">{audit.social.original.total.toLocaleString('pt-BR')}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Médica (Perícia)</div>
            <div className="text-lg font-bold font-mono">{audit.medical.original.total.toLocaleString('pt-BR')}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Combinado (Perícia)</div>
            <div className="text-lg font-bold font-mono">{audit.combinedOriginal.toLocaleString('pt-BR')}</div>
            <div className={`text-xs font-semibold ${classColor(audit.classificationOriginal)}`}>{audit.classificationOriginal}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Combinado (Fuzzy)</div>
            <div className={`text-lg font-bold font-mono ${changed ? 'text-accent' : ''}`}>{audit.combinedFuzzy.toLocaleString('pt-BR')}</div>
            <div className={`text-xs font-semibold ${classColor(audit.classificationFuzzy)}`}>{audit.classificationFuzzy}</div>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistTable label="Perícia Social" orig={audit.social.original} fuzzy={audit.social.fuzzy} />
        <DistTable label="Perícia Médica" orig={audit.medical.original} fuzzy={audit.medical.fuzzy} />
      </div>

      {/* Domain totals */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-primary/5 px-4 py-2 font-semibold text-sm">Totais por Domínio</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground text-left">
              <th className="px-3 py-2">Domínio</th>
              <th className="px-3 py-2 text-center">Social</th>
              <th className="px-3 py-2 text-center">Social Fuzzy</th>
              <th className="px-3 py-2 text-center">Médica</th>
              <th className="px-3 py-2 text-center">Médica Fuzzy</th>
            </tr>
          </thead>
          <tbody>
            {DOMAINS.map(d => {
              const s = audit.social.domainTotals[d.id];
              const m = audit.medical.domainTotals[d.id];
              return (
                <tr key={d.id} className="border-b border-border/50">
                  <td className="px-3 py-1.5 text-xs">{d.name}</td>
                  <td className="px-3 py-1.5 text-center font-mono">{s.original}</td>
                  <td className={`px-3 py-1.5 text-center font-mono ${s.fuzzy !== s.original ? 'text-accent font-bold' : ''}`}>{s.fuzzy}</td>
                  <td className="px-3 py-1.5 text-center font-mono">{m.original}</td>
                  <td className={`px-3 py-1.5 text-center font-mono ${m.fuzzy !== m.original ? 'text-accent font-bold' : ''}`}>{m.fuzzy}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Parameters */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => setShowParams(!showParams)} className="text-xs text-muted-foreground">
          <Settings2 className="w-3.5 h-3.5 mr-1" /> {showParams ? 'Ocultar' : 'Editar'} Faixas de Classificação
        </Button>
        {showParams && (
          <div className="mt-3 p-4 border border-border rounded-lg space-y-3">
            {(['grave', 'moderada', 'leve', 'insuficiente'] as const).map(key => (
              <div key={key} className="flex items-center gap-3 text-sm">
                <span className="w-28 font-medium capitalize">{key}</span>
                <Input type="number" value={ranges[key].min} className="w-24 h-8 text-xs font-mono"
                  onChange={(e) => onRangesChange({ ...ranges, [key]: { ...ranges[key], min: parseInt(e.target.value) || 0 } })} />
                <span className="text-muted-foreground">a</span>
                <Input type="number" value={ranges[key].max} className="w-24 h-8 text-xs font-mono"
                  onChange={(e) => onRangesChange({ ...ranges, [key]: { ...ranges[key], max: parseInt(e.target.value) || 0 } })} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
        <Button onClick={onNext} size="lg">Gerar Certidão →</Button>
      </div>
    </div>
  );
}
