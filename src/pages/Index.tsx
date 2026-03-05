import { useState, useCallback } from 'react';
import {
  type AppMode, type ScoreValue, type ScoreOrigin, type DisabilityType, type DisabilityFlags,
  type ClassificationRanges, type CertificateHeader, type AuditTrail,
  DEFAULT_RANGES, DEFAULT_HEADER, ITEMS,
} from '@/lib/ifbra-types';
import { applyFuzzy, buildAuditTrail } from '@/lib/ifbra-engine';
import AppStepper from '@/components/ifbra/AppStepper';
import ModeSelector from '@/components/ifbra/ModeSelector';
import DataInputStep from '@/components/ifbra/DataInputStep';
import DataReviewStep from '@/components/ifbra/DataReviewStep';
import FuzzyConfigStep from '@/components/ifbra/FuzzyConfigStep';
import ResultsView from '@/components/ifbra/ResultsView';
import CertificateView from '@/components/ifbra/CertificateView';
import SingleReportView from '@/components/ifbra/SingleReportView';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export default function Index() {
  const [mode, setMode] = useState<AppMode | null>(null);
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);

  // Scores
  const [socialScores, setSocialScores] = useState<Record<string, number>>({});
  const [medicalScores, setMedicalScores] = useState<Record<string, number>>({});
  const [socialOrigins, setSocialOrigins] = useState<Record<string, ScoreOrigin>>({});
  const [medicalOrigins, setMedicalOrigins] = useState<Record<string, ScoreOrigin>>({});

  // Fuzzy config
  const [selectedDisabilities, setSelectedDisabilities] = useState<DisabilityType[]>([]);
  const [disabilityFlags, setDisabilityFlags] = useState<Record<DisabilityType, DisabilityFlags>>({
    visual: { emblematic: false, auxilio: false },
    auditiva: { emblematic: false, auxilio: false },
    intelectual: { emblematic: false, auxilio: false },
    motora: { emblematic: false, auxilio: false },
  });

  // Results
  const [audit, setAudit] = useState<AuditTrail | null>(null);
  const [ranges, setRanges] = useState<ClassificationRanges>(DEFAULT_RANGES);
  const [header, setHeader] = useState<CertificateHeader>(DEFAULT_HEADER);

  // Fuzzy results
  const [socialFuzzy, setSocialFuzzy] = useState<Record<string, number>>({});
  const [medicalFuzzy, setMedicalFuzzy] = useState<Record<string, number>>({});

  const goTo = useCallback((s: number) => {
    setStep(s);
    setMaxStep(prev => Math.max(prev, s));
  }, []);

  const handleSocialScoreChange = useCallback((itemId: string, score: ScoreValue) => {
    setSocialScores(prev => ({ ...prev, [itemId]: score }));
    setSocialOrigins(prev => ({ ...prev, [itemId]: prev[itemId] === 'extracted' ? 'edited' : (prev[itemId] || 'manual') }));
  }, []);

  const handleMedicalScoreChange = useCallback((itemId: string, score: ScoreValue) => {
    setMedicalScores(prev => ({ ...prev, [itemId]: score }));
    setMedicalOrigins(prev => ({ ...prev, [itemId]: prev[itemId] === 'extracted' ? 'edited' : (prev[itemId] || 'manual') }));
  }, []);

  const handleBulkSocial = useCallback((scores: Record<string, number>, origins: Record<string, ScoreOrigin>) => {
    setSocialScores(prev => ({ ...prev, ...scores }));
    setSocialOrigins(prev => ({ ...prev, ...origins }));
  }, []);

  const handleBulkMedical = useCallback((scores: Record<string, number>, origins: Record<string, ScoreOrigin>) => {
    setMedicalScores(prev => ({ ...prev, ...scores }));
    setMedicalOrigins(prev => ({ ...prev, ...origins }));
  }, []);

  const toggleDisability = useCallback((d: DisabilityType) => {
    setSelectedDisabilities(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  }, []);

  const updateFlags = useCallback((d: DisabilityType, partial: Partial<DisabilityFlags>) => {
    setDisabilityFlags(prev => ({
      ...prev,
      [d]: { ...prev[d], ...partial },
    }));
  }, []);

  const calculateResults = useCallback(() => {
    // For single modes, use empty scores for the absent assessment
    const socScores = mode === 'single-medical' ? Object.fromEntries(ITEMS.map(i => [i.id, 100])) : socialScores;
    const medScores = mode === 'single-social' ? Object.fromEntries(ITEMS.map(i => [i.id, 100])) : medicalScores;

    const { socialFuzzy: sf, medicalFuzzy: mf, auditEntries } = applyFuzzy(
      socScores, medScores, selectedDisabilities, disabilityFlags
    );
    setSocialFuzzy(sf);
    setMedicalFuzzy(mf);

    const socOrigins = mode === 'single-medical' ? Object.fromEntries(ITEMS.map(i => [i.id, 'manual' as ScoreOrigin])) : socialOrigins;
    const medOrigins = mode === 'single-social' ? Object.fromEntries(ITEMS.map(i => [i.id, 'manual' as ScoreOrigin])) : medicalOrigins;

    const trail = buildAuditTrail(
      socScores, medScores, sf, mf,
      auditEntries, socOrigins, medOrigins, ranges
    );
    setAudit(trail);
    goTo(3);
  }, [mode, socialScores, medicalScores, selectedDisabilities, disabilityFlags, socialOrigins, medicalOrigins, ranges, goTo]);

  const resetAll = () => {
    setMode(null);
    setStep(0);
    setMaxStep(0);
    setSocialScores({});
    setMedicalScores({});
    setSocialOrigins({});
    setMedicalOrigins({});
    setSelectedDisabilities([]);
    setDisabilityFlags({
      visual: { emblematic: false, auxilio: false },
      auditiva: { emblematic: false, auxilio: false },
      intelectual: { emblematic: false, auxilio: false },
      motora: { emblematic: false, auxilio: false },
    });
    setAudit(null);
    setRanges(DEFAULT_RANGES);
    setHeader(DEFAULT_HEADER);
    setSocialFuzzy({});
    setMedicalFuzzy({});
  };

  const isSingle = mode === 'single-social' || mode === 'single-medical';
  const modeLabel = mode === 'single-social' ? 'Laudo Único — Social' : mode === 'single-medical' ? 'Laudo Único — Médico' : 'Laudo Completo';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">IFBrA — Modelo Linguístico Fuzzy</h1>
            <p className="text-xs text-muted-foreground">
              Calculadora de enquadramento · Portaria Interministerial nº 1/2014
              {mode && <span className="ml-2 font-medium text-primary">· {modeLabel}</span>}
            </p>
          </div>
          {mode && (
            <Button variant="ghost" size="sm" onClick={resetAll} className="text-xs text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reiniciar
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {!mode && <ModeSelector onSelect={(m) => setMode(m)} />}

        {mode && (
          <>
            <AppStepper currentStep={step} onStepClick={goTo} maxReachedStep={maxStep} mode={mode} />

            {step === 0 && (
              <DataInputStep
                mode={mode}
                socialScores={socialScores} medicalScores={medicalScores}
                socialOrigins={socialOrigins} medicalOrigins={medicalOrigins}
                onSocialScoreChange={handleSocialScoreChange}
                onMedicalScoreChange={handleMedicalScoreChange}
                onBulkSocialScores={handleBulkSocial}
                onBulkMedicalScores={handleBulkMedical}
                onNext={() => goTo(1)}
              />
            )}

            {step === 1 && (
              <DataReviewStep
                mode={mode}
                socialScores={socialScores} medicalScores={medicalScores}
                socialOrigins={socialOrigins} medicalOrigins={medicalOrigins}
                onSocialScoreChange={handleSocialScoreChange}
                onMedicalScoreChange={handleMedicalScoreChange}
                onBack={() => goTo(0)} onNext={() => goTo(2)}
              />
            )}

            {step === 2 && (
              <FuzzyConfigStep
                socialScores={mode === 'single-medical' ? Object.fromEntries(ITEMS.map(i => [i.id, 100])) : socialScores}
                medicalScores={mode === 'single-social' ? Object.fromEntries(ITEMS.map(i => [i.id, 100])) : medicalScores}
                selectedDisabilities={selectedDisabilities}
                disabilityFlags={disabilityFlags}
                onToggleDisability={toggleDisability}
                onUpdateFlags={updateFlags}
                onBack={() => goTo(1)} onNext={calculateResults}
              />
            )}

            {/* Step 3: Results (complete) or SingleReport (single) */}
            {step === 3 && audit && !isSingle && (
              <ResultsView
                audit={audit} ranges={ranges}
                onRangesChange={setRanges}
                onBack={() => goTo(2)} onNext={() => goTo(4)}
              />
            )}

            {step === 3 && audit && isSingle && (
              <SingleReportView
                type={mode === 'single-social' ? 'social' : 'medical'}
                scores={mode === 'single-social' ? socialScores : medicalScores}
                fuzzyScores={mode === 'single-social' ? socialFuzzy : medicalFuzzy}
                audit={audit}
                selectedDisabilities={selectedDisabilities}
                onBack={() => goTo(2)}
              />
            )}

            {/* Step 4: Certificate (complete only) */}
            {step === 4 && audit && !isSingle && (
              <CertificateView
                audit={audit} header={header}
                selectedDisabilities={selectedDisabilities}
                onHeaderChange={setHeader}
                onBack={() => goTo(3)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
