import { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type ScoreValue, type ScoreOrigin, type AppMode, ITEMS } from '@/lib/ifbra-types';
import { extractScoresFromPdf } from '@/lib/pdf-extractor';
import ScoreTable from './ScoreTable';

interface DataInputStepProps {
  mode: AppMode;
  socialScores: Record<string, number>;
  medicalScores: Record<string, number>;
  socialOrigins: Record<string, ScoreOrigin>;
  medicalOrigins: Record<string, ScoreOrigin>;
  onSocialScoreChange: (itemId: string, score: ScoreValue) => void;
  onMedicalScoreChange: (itemId: string, score: ScoreValue) => void;
  onBulkSocialScores: (scores: Record<string, number>, origins: Record<string, ScoreOrigin>) => void;
  onBulkMedicalScores: (scores: Record<string, number>, origins: Record<string, ScoreOrigin>) => void;
  onNext: () => void;
}

export default function DataInputStep({
  mode, socialScores, medicalScores, socialOrigins, medicalOrigins,
  onSocialScoreChange, onMedicalScoreChange,
  onBulkSocialScores, onBulkMedicalScores, onNext,
}: DataInputStepProps) {
  const [socialMethod, setSocialMethod] = useState<'manual' | 'pdf'>('manual');
  const [medicalMethod, setMedicalMethod] = useState<'manual' | 'pdf'>('manual');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showSocial = mode === 'complete' || mode === 'single-social';
  const showMedical = mode === 'complete' || mode === 'single-medical';

  const handlePdfUpload = async (type: 'social' | 'medical', file: File) => {
    setLoading(type);
    setError(null);
    try {
      const extracted = await extractScoresFromPdf(file);
      const origins: Record<string, ScoreOrigin> = {};
      for (const key of Object.keys(extracted)) {
        origins[key] = 'extracted';
      }
      if (type === 'social') {
        onBulkSocialScores(extracted, origins);
      } else {
        onBulkMedicalScores(extracted, origins);
      }
      const extractedCount = Object.keys(extracted).length;
      if (extractedCount < 41) {
        setError(`${type === 'social' ? 'Social' : 'Médica'}: Extraídos apenas ${extractedCount}/41 itens. Complete manualmente os faltantes.`);
      }
    } catch (e) {
      setError(`Erro ao processar PDF: ${e instanceof Error ? e.message : 'erro desconhecido'}`);
    } finally {
      setLoading(null);
    }
  };

  const socialCount = Object.keys(socialScores).filter(k => ITEMS.some(i => i.id === k)).length;
  const medicalCount = Object.keys(medicalScores).filter(k => ITEMS.some(i => i.id === k)).length;

  const canProceed = mode === 'complete'
    ? socialCount === 41 && medicalCount === 41
    : mode === 'single-social'
      ? socialCount === 41
      : medicalCount === 41;

  const missingLabel = mode === 'complete'
    ? 'Preencha todos os 41 itens em ambas as perícias para continuar.'
    : `Preencha todos os 41 itens da perícia ${mode === 'single-social' ? 'social' : 'médica'} para continuar.`;

  const isSingle = mode !== 'complete';

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-1 ${isSingle ? 'max-w-xl mx-auto' : 'lg:grid-cols-2'} gap-6`}>
        {/* Social */}
        {showSocial && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Perícia Social</h3>
              <span className="text-xs text-muted-foreground font-mono">{socialCount}/41</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={socialMethod === 'manual' ? 'default' : 'outline'} onClick={() => setSocialMethod('manual')}>
                <FileText className="w-3.5 h-3.5 mr-1" /> Manual
              </Button>
              <Button size="sm" variant={socialMethod === 'pdf' ? 'default' : 'outline'} onClick={() => setSocialMethod('pdf')}>
                <Upload className="w-3.5 h-3.5 mr-1" /> Upload PDF
              </Button>
            </div>
            {socialMethod === 'pdf' && (
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{loading === 'social' ? 'Processando...' : 'Selecionar PDF Social'}</span>
                <input type="file" accept=".pdf" className="hidden" disabled={loading === 'social'}
                  onChange={(e) => e.target.files?.[0] && handlePdfUpload('social', e.target.files[0])} />
              </label>
            )}
            <ScoreTable scores={socialScores} origins={socialOrigins} onScoreChange={onSocialScoreChange} label="Pontuação Social" />
          </div>
        )}

        {/* Medical */}
        {showMedical && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Perícia Médica</h3>
              <span className="text-xs text-muted-foreground font-mono">{medicalCount}/41</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={medicalMethod === 'manual' ? 'default' : 'outline'} onClick={() => setMedicalMethod('manual')}>
                <FileText className="w-3.5 h-3.5 mr-1" /> Manual
              </Button>
              <Button size="sm" variant={medicalMethod === 'pdf' ? 'default' : 'outline'} onClick={() => setMedicalMethod('pdf')}>
                <Upload className="w-3.5 h-3.5 mr-1" /> Upload PDF
              </Button>
            </div>
            {medicalMethod === 'pdf' && (
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{loading === 'medical' ? 'Processando...' : 'Selecionar PDF Médico'}</span>
                <input type="file" accept=".pdf" className="hidden" disabled={loading === 'medical'}
                  onChange={(e) => e.target.files?.[0] && handlePdfUpload('medical', e.target.files[0])} />
              </label>
            )}
            <ScoreTable scores={medicalScores} origins={medicalOrigins} onScoreChange={onMedicalScoreChange} label="Pontuação Médica" />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 text-warning shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed} size="lg">
          Avançar para Revisão →
        </Button>
      </div>
      {!canProceed && (
        <p className="text-xs text-muted-foreground text-right">{missingLabel}</p>
      )}
    </div>
  );
}
