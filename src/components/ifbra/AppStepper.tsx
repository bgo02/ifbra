import { Check } from 'lucide-react';

const STEPS = [
  { label: 'Entrada', description: 'Dados' },
  { label: 'Revisão', description: 'Conferência' },
  { label: 'Fuzzy', description: 'Deficiência' },
  { label: 'Resultados', description: 'Quadros' },
  { label: 'Certidão', description: 'Exportar' },
];

interface AppStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  maxReachedStep: number;
}

export default function AppStepper({ currentStep, onStepClick, maxReachedStep }: AppStepperProps) {
  return (
    <nav className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {STEPS.map((step, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        const isClickable = idx <= maxReachedStep;

        return (
          <div key={idx} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick(idx)}
              disabled={!isClickable}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-primary text-primary-foreground' : ''}
                ${isCompleted ? 'bg-primary/10 text-primary' : ''}
                ${!isActive && !isCompleted ? 'text-muted-foreground' : ''}
                ${isClickable && !isActive ? 'hover:bg-secondary cursor-pointer' : ''}
                ${!isClickable ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                ${isActive ? 'bg-primary-foreground text-primary' : ''}
                ${isCompleted ? 'bg-primary text-primary-foreground' : ''}
                ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
              `}>
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`w-4 sm:w-8 h-px mx-1 ${idx < currentStep ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
