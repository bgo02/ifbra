import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, FileJson, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  type AuditTrail, type DisabilityType, ITEMS, DOMAINS,
} from '@/lib/ifbra-types';
import { generateSingleReportHtml } from '@/lib/certificate-html-generator';

interface SingleReportHeader {
  processo: string;
  perito: string;
  data: string;
  orgao: string;
}

interface SingleReportViewProps {
  type: 'social' | 'medical';
  scores: Record<string, number>;
  fuzzyScores: Record<string, number>;
  audit: AuditTrail;
  selectedDisabilities: DisabilityType[];
  onBack: () => void;
}

export default function SingleReportView({ type, scores, fuzzyScores, audit, selectedDisabilities, onBack }: SingleReportViewProps) {
  const [showHeader, setShowHeader] = useState(true);
  const [header, setHeader] = useState<SingleReportHeader>({
    processo: '',
    perito: '',
    data: new Date().toLocaleDateString('pt-BR'),
    orgao: '',
  });

  const periLabel = type === 'social' ? 'Perícia Social' : 'Perícia Médica';
  const side = type === 'social' ? audit.social : audit.medical;
  const fuzzyApplied = side.original.total !== side.fuzzy.total;

  const domainsAffected = useMemo(() => {
    const result: Array<{ domainName: string; minScore: number }> = [];
    for (const entry of audit.disabilities) {
      const sideEntry = type === 'social' ? entry.social : entry.medical;
      if (!sideEntry.fired) continue;
      for (const d of sideEntry.domainsAffected) {
        if (d.itemsChanged.length > 0 && !result.find(r => r.domainName === d.domainName)) {
          result.push({ domainName: d.domainName, minScore: d.minScore });
        }
      }
    }
    return result;
  }, [audit, type]);

  const reportHtml = useMemo(() => generateSingleReportHtml(
    type, scores, fuzzyScores, header,
    { fuzzyApplied, domainsAffected, totalOriginal: side.original.total, totalFuzzy: side.fuzzy.total },
  ), [type, scores, fuzzyScores, header, fuzzyApplied, domainsAffected, side]);

  const printPdf = () => {
    const w = window.open('', '_blank');
    if (!w) { toast.error('Popup bloqueado. Permita popups para gerar o PDF.'); return; }
    w.document.write(reportHtml);
    w.document.close();
    w.onload = () => { w.print(); };
  };

  const downloadHtml = () => {
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laudo-ifbra-${type}${header.processo ? `-${header.processo}` : ''}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML do laudo baixado');
  };

  const downloadJson = () => {
    const data = { type, header, scores, fuzzyScores, audit, selectedDisabilities, generatedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-ifbra-${type}${header.processo ? `-${header.processo}` : ''}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON de auditoria baixado');
  };

  const updateField = (field: keyof SingleReportHeader, value: string) => {
    setHeader(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header fields */}
      <div className="bg-card border border-border rounded-lg">
        <button onClick={() => setShowHeader(!showHeader)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold">
          Campos do Cabeçalho
          {showHeader ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showHeader && (
          <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              ['processo', 'Nº do Processo'],
              ['perito', 'Perito'],
              ['data', 'Data'],
              ['orgao', 'Órgão'],
            ] as const).map(([field, label]) => (
              <div key={field}>
                <label className="text-xs text-muted-foreground">{label}</label>
                <Input value={header[field]} onChange={(e) => updateField(field, e.target.value)} className="h-8 text-sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fuzzy badge */}
      <div className="flex items-center gap-3">
        <Badge variant={fuzzyApplied ? 'default' : 'outline'} className="text-xs">
          {fuzzyApplied ? 'Fuzzy aplicado' : 'Fuzzy não aplicado'}
        </Badge>
        {fuzzyApplied && domainsAffected.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Domínios: {domainsAffected.map(d => `${d.domainName} (min: ${d.minScore})`).join(', ')}
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-muted-foreground">{periLabel} (Perícia)</div>
            <div className="text-lg font-bold font-mono">{side.original.total.toLocaleString('pt-BR')}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{periLabel} (Fuzzy)</div>
            <div className={`text-lg font-bold font-mono ${fuzzyApplied ? 'text-accent' : ''}`}>{side.fuzzy.total.toLocaleString('pt-BR')}</div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-primary/5 px-4 py-2 font-semibold text-sm">Prévia do Laudo</div>
        <div className="p-4 bg-card overflow-auto max-h-[50vh]">
          <iframe
            srcDoc={reportHtml}
            className="w-full border-0"
            style={{ minHeight: '400px' }}
            title="Prévia do laudo"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={printPdf} size="lg">
          <Printer className="w-4 h-4 mr-2" /> Imprimir / Salvar PDF
        </Button>
        <Button variant="outline" onClick={downloadHtml}>
          <Download className="w-4 h-4 mr-2" /> Baixar HTML
        </Button>
        <Button variant="outline" onClick={downloadJson}>
          <FileJson className="w-4 h-4 mr-2" /> Baixar JSON (auditoria)
        </Button>
      </div>

      <div className="flex justify-start">
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
      </div>
    </div>
  );
}
