import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type AuditTrail, type CertificateHeader, type DisabilityType } from '@/lib/ifbra-types';
import { generateCertificate } from '@/lib/certificate-generator';
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
  const certificateText = useMemo(
    () => generateCertificate(header, audit, selectedDisabilities),
    [header, audit, selectedDisabilities]
  );

  const downloadTxt = () => {
    const blob = new Blob([certificateText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certidao-ifbra${header.processo ? `-${header.processo}` : ''}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Certidão baixada com sucesso');
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(certificateText);
    toast.success('Certidão copiada para a área de transferência');
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

      {/* Preview */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-primary/5 px-4 py-2 font-semibold text-sm">Prévia da Certidão</div>
        <div className="p-4 sm:p-6 bg-card overflow-auto max-h-[60vh]">
          <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">{certificateText}</pre>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={downloadTxt} size="lg">
          <Download className="w-4 h-4 mr-2" /> Baixar Certidão (.txt)
        </Button>
        <Button variant="outline" onClick={downloadJson}>
          <FileJson className="w-4 h-4 mr-2" /> Baixar JSON (auditoria)
        </Button>
        <Button variant="ghost" onClick={copyToClipboard}>
          <Copy className="w-4 h-4 mr-2" /> Copiar Certidão
        </Button>
      </div>

      <div className="flex justify-start">
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
      </div>
    </div>
  );
}
