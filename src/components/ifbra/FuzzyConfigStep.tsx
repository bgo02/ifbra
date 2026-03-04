import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DISABILITY_CONFIG, DOMAINS, type DisabilityType, type DisabilityFlags } from '@/lib/ifbra-types';
import { checkScoreCondition, getItemsByDomain } from '@/lib/ifbra-engine';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const DISABILITY_KEYS: DisabilityType[] = ['visual', 'auditiva', 'intelectual', 'motora'];

interface FuzzyConfigStepProps {
  socialScores: Record<string, number>;
  medicalScores: Record<string, number>;
  selectedDisabilities: DisabilityType[];
  disabilityFlags: Record<DisabilityType, DisabilityFlags>;
  onToggleDisability: (d: DisabilityType) => void;
  onUpdateFlags: (d: DisabilityType, flags: Partial<DisabilityFlags>) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function FuzzyConfigStep({
  socialScores, medicalScores, selectedDisabilities, disabilityFlags,
  onToggleDisability, onUpdateFlags, onBack, onNext,
}: FuzzyConfigStepProps) {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          Seleção de Deficiência e Condições
        </h3>
        <p className="text-xs text-muted-foreground">
          Selecione as deficiências aplicáveis. O Fuzzy será aplicado com lógica OR: qualquer condição basta.
        </p>
      </div>

      <div className="space-y-4">
        {DISABILITY_KEYS.map(d => {
          const config = DISABILITY_CONFIG[d];
          const isSelected = selectedDisabilities.includes(d);
          const flags = disabilityFlags[d] || { emblematic: false, auxilio: false };
          const socialScoreCond = checkScoreCondition(socialScores, config.sensitiveDomains);
          const medicalScoreCond = checkScoreCondition(medicalScores, config.sensitiveDomains);
          const scoreCond = socialScoreCond || medicalScoreCond;
          const wouldFire = isSelected && (scoreCond || flags.emblematic || flags.auxilio);

          return (
            <div key={d} className={`border rounded-lg p-4 transition-colors ${isSelected ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleDisability(d)}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{config.label}</span>
                    {isSelected && (
                      wouldFire
                        ? <span className="flex items-center gap-1 text-xs text-accent font-medium"><AlertTriangle className="w-3.5 h-3.5" /> Fuzzy será aplicado</span>
                        : <span className="flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle2 className="w-3.5 h-3.5" /> Nenhuma condição ativa</span>
                    )}
                  </div>

                  {isSelected && (
                    <>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Domínios sensíveis:</span>{' '}
                        {config.sensitiveDomains.map(id => DOMAINS.find(dom => dom.id === id)?.name).join(', ')}
                      </div>

                      {/* Score condition */}
                      <div className={`flex items-start gap-2 p-2 rounded text-xs ${scoreCond ? 'bg-accent/10' : 'bg-muted/50'}`}>
                        <span className="font-medium shrink-0">
                          Condição por pontuação:{' '}
                          <span className={scoreCond ? 'text-accent' : 'text-muted-foreground'}>
                            {scoreCond ? 'Detectada ✓' : 'Não detectada'}
                          </span>
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{config.scoreConditionText}</p>

                      {/* Emblematic */}
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={flags.emblematic}
                          onCheckedChange={(c) => onUpdateFlags(d, { emblematic: !!c })}
                          className="mt-0.5"
                        />
                        <span className="text-xs">{config.emblematicQuestion}</span>
                      </label>

                      {/* Auxilio */}
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={flags.auxilio}
                          onCheckedChange={(c) => onUpdateFlags(d, { auxilio: !!c })}
                          className="mt-0.5"
                        />
                        <span className="text-xs">Não dispõe do auxílio de terceiros sempre que necessário.</span>
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
        <Button onClick={onNext} size="lg">Calcular Resultados →</Button>
      </div>
    </div>
  );
}
