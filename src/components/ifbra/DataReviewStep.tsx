import { Button } from '@/components/ui/button';
import { type ScoreValue, type ScoreOrigin, type AppMode, ITEMS } from '@/lib/ifbra-types';
import { validateScores, calculateScoreDistribution } from '@/lib/ifbra-engine';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import ScoreTable from './ScoreTable';

interface DataReviewStepProps {
  mode: AppMode;
  socialScores: Record<string, number>;
  medicalScores: Record<string, number>;
  socialOrigins: Record<string, ScoreOrigin>;
  medicalOrigins: Record<string, ScoreOrigin>;
  onSocialScoreChange: (itemId: string, score: ScoreValue) => void;
  onMedicalScoreChange: (itemId: string, score: ScoreValue) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function DataReviewStep({
  mode, socialScores, medicalScores, socialOrigins, medicalOrigins,
  onSocialScoreChange, onMedicalScoreChange, onBack, onNext,
}: DataReviewStepProps) {
  const showSocial = mode === 'complete' || mode === 'single-social';
  const showMedical = mode === 'complete' || mode === 'single-medical';

  const socialValidation = showSocial ? validateScores(socialScores) : { valid: true, missing: [], invalid: [] };
  const medicalValidation = showMedical ? validateScores(medicalScores) : { valid: true, missing: [], invalid: [] };
  const allValid = socialValidation.valid && medicalValidation.valid;
  const socialDist = calculateScoreDistribution(socialScores);
  const medicalDist = calculateScoreDistribution(medicalScores);
  const isSingle = mode !== 'complete';

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          {allValid ? <CheckCircle2 className="w-5 h-5 text-success" /> : <AlertCircle className="w-5 h-5 text-destructive" />}
          Conferência dos Dados
        </h3>
        {!allValid && (
          <div className="space-y-2 text-sm">
            {showSocial && socialValidation.missing.length > 0 && (
              <p className="text-destructive">Social — Itens faltantes: {socialValidation.missing.join(', ')}</p>
            )}
            {showSocial && socialValidation.invalid.length > 0 && (
              <p className="text-destructive">Social — Valores inválidos: {socialValidation.invalid.join(', ')}</p>
            )}
            {showMedical && medicalValidation.missing.length > 0 && (
              <p className="text-destructive">Médica — Itens faltantes: {medicalValidation.missing.join(', ')}</p>
            )}
            {showMedical && medicalValidation.invalid.length > 0 && (
              <p className="text-destructive">Médica — Valores inválidos: {medicalValidation.invalid.join(', ')}</p>
            )}
          </div>
        )}
        {allValid && (
          <div className={`grid ${isSingle ? 'grid-cols-1' : 'grid-cols-2'} gap-4 text-sm`}>
            {showSocial && (
              <div>
                <span className="text-muted-foreground">Social total:</span>{' '}
                <span className="font-semibold font-mono">{socialDist.total.toLocaleString('pt-BR')}</span>
              </div>
            )}
            {showMedical && (
              <div>
                <span className="text-muted-foreground">Médica total:</span>{' '}
                <span className="font-semibold font-mono">{medicalDist.total.toLocaleString('pt-BR')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`grid grid-cols-1 ${isSingle ? 'max-w-xl mx-auto' : 'lg:grid-cols-2'} gap-6`}>
        {showSocial && (
          <ScoreTable
            scores={socialScores} origins={socialOrigins}
            onScoreChange={(id, score) => onSocialScoreChange(id, score)}
            label="Revisão — Perícia Social"
          />
        )}
        {showMedical && (
          <ScoreTable
            scores={medicalScores} origins={medicalOrigins}
            onScoreChange={(id, score) => onMedicalScoreChange(id, score)}
            label="Revisão — Perícia Médica"
          />
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
        <Button onClick={onNext} disabled={!allValid} size="lg">Avançar para Fuzzy →</Button>
      </div>
    </div>
  );
}
