import { Button } from '@/components/ui/button';
import { type ScoreValue, type ScoreOrigin, ITEMS } from '@/lib/ifbra-types';
import { validateScores, calculateScoreDistribution } from '@/lib/ifbra-engine';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import ScoreTable from './ScoreTable';

interface DataReviewStepProps {
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
  socialScores, medicalScores, socialOrigins, medicalOrigins,
  onSocialScoreChange, onMedicalScoreChange, onBack, onNext,
}: DataReviewStepProps) {
  const socialValidation = validateScores(socialScores);
  const medicalValidation = validateScores(medicalScores);
  const allValid = socialValidation.valid && medicalValidation.valid;
  const socialDist = calculateScoreDistribution(socialScores);
  const medicalDist = calculateScoreDistribution(medicalScores);

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          {allValid ? <CheckCircle2 className="w-5 h-5 text-success" /> : <AlertCircle className="w-5 h-5 text-destructive" />}
          Conferência dos Dados
        </h3>
        {!allValid && (
          <div className="space-y-2 text-sm">
            {socialValidation.missing.length > 0 && (
              <p className="text-destructive">Social — Itens faltantes: {socialValidation.missing.join(', ')}</p>
            )}
            {socialValidation.invalid.length > 0 && (
              <p className="text-destructive">Social — Valores inválidos: {socialValidation.invalid.join(', ')}</p>
            )}
            {medicalValidation.missing.length > 0 && (
              <p className="text-destructive">Médica — Itens faltantes: {medicalValidation.missing.join(', ')}</p>
            )}
            {medicalValidation.invalid.length > 0 && (
              <p className="text-destructive">Médica — Valores inválidos: {medicalValidation.invalid.join(', ')}</p>
            )}
          </div>
        )}
        {allValid && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Social total:</span>{' '}
              <span className="font-semibold font-mono">{socialDist.total.toLocaleString('pt-BR')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Médica total:</span>{' '}
              <span className="font-semibold font-mono">{medicalDist.total.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreTable
          scores={socialScores}
          origins={socialOrigins}
          onScoreChange={(id, score) => onSocialScoreChange(id, score)}
          label="Revisão — Perícia Social"
        />
        <ScoreTable
          scores={medicalScores}
          origins={medicalOrigins}
          onScoreChange={(id, score) => onMedicalScoreChange(id, score)}
          label="Revisão — Perícia Médica"
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
        <Button onClick={onNext} disabled={!allValid} size="lg">Avançar para Fuzzy →</Button>
      </div>
    </div>
  );
}
