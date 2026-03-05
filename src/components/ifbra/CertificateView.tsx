import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type AuditTrail, type CertificateHeader, type DisabilityType } from '@/lib/ifbra-types';
import { generateCertificateHtml, getCertificateBodyHtml } from '@/lib/certificate-html-generator';
import { Download, Copy, FileJson, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

interface CertificateViewProps {
  audit: AuditTrail;
  header: CertificateHeader;
  selectedDisabilities: DisabilityType[];
  onHeaderChange: (header: CertificateHeader) => void;
  onBack: () => void;
}

export default function CertificateView({ audit, header, selectedDisabilities, onHeaderChange, onBack }: CertificateViewProps) {
  const [showHeader, setShowHeader] = useState(true);

  const fullHtml = useMemo(
    () => generateCertificateHtml(header, audit, selectedDisabilities),
    [header, audit, selectedDisabilities]
  );

  const bodyHtml = useMemo(
    () => getCertificateBodyHtml(header, audit, selectedDisabilities),
    [header, audit, selectedDisabilities]
  );

  const downloadHtml = () => {
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certidao-ifbra${header.processo ? `-${header.processo}` : ''}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Certidão HTML baixada');
  };

  const downloadJson = () => {
    const data = { header, audit, selectedDisabilities, generatedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-ifbra${header.processo ? `-${header.processo}` : ''}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON de auditoria baixado');
  };

  const copyForWord = async () => {
    try {
      const htmlContent = `<html><body>${bodyHtml}</body></html>`;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blob,
          'text/plain': textBlob,
        }),
      ]);
      toast.success('Certidão copiada! Cole no Word para manter tabelas e formatação.');
    } catch {
      // Fallback
      const textContent = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      await navigator.clipboard.writeText(textContent);
      toast.info('Copiado como texto simples (navegador não suporta cópia HTML).');
    }
  };

  const updateField = (field: keyof CertificateHeader, value: string) => {
    onHeaderChange({ ...header, [field]: value });
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
              ['autor', 'Autor'],
              ['reu', 'Réu'],
              ['eventoSocial', 'Evento Social'],
              ['eventoMedico', 'Evento Médico'],
              ['dataHora', 'Data'],
              ['tribunal', 'Tribunal'],
              ['vara', 'Vara'],
            ] as const).map(([field, label]) => (
              <div key={field}>
                <label className="text-xs text-muted-foreground">{label}</label>
                <Input value={header[field]} onChange={(e) => updateField(field, e.target.value)} className="h-8 text-sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WYSIWYG Preview */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-primary/5 px-4 py-2 font-semibold text-sm">Prévia da Certidão</div>
        <div className="p-4 sm:p-6 bg-card overflow-auto max-h-[60vh]">
          <div
            className="prose prose-sm max-w-none text-foreground"
            style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12pt', lineHeight: '1.5' }}
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={copyForWord} size="lg">
          <Copy className="w-4 h-4 mr-2" /> Copiar certidão (Word)
        </Button>
        <Button variant="outline" onClick={downloadHtml}>
          <Download className="w-4 h-4 mr-2" /> Baixar certidão (.html)
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
