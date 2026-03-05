import { Button } from '@/components/ui/button';
import { FileText, Files, ArrowRight } from 'lucide-react';
import type { AppMode } from '@/lib/ifbra-types';

interface ModeSelectorProps {
  onSelect: (mode: AppMode) => void;
}

export default function ModeSelector({ onSelect }: ModeSelectorProps) {
  const modes: Array<{ mode: AppMode; title: string; description: string; icon: React.ReactNode }> = [
    {
      mode: 'single-social',
      title: 'Laudo Único — Social',
      description: 'Preencha apenas a perícia social. Gera PDF do formulário com pontuações e resultado do fuzzy.',
      icon: <FileText className="w-6 h-6" />,
    },
    {
      mode: 'single-medical',
      title: 'Laudo Único — Médico',
      description: 'Preencha apenas a perícia médica. Gera PDF do formulário com pontuações e resultado do fuzzy.',
      icon: <FileText className="w-6 h-6" />,
    },
    {
      mode: 'complete',
      title: 'Laudo Completo — Social + Médico',
      description: 'Preencha ambas as perícias e gere a certidão de enquadramento com tabelas para Word.',
      icon: <Files className="w-6 h-6" />,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">Selecione o modo de operação</h2>
        <p className="text-sm text-muted-foreground">
          Escolha se deseja preencher um laudo único (apenas uma perícia) ou o laudo completo com certidão.
        </p>
      </div>

      <div className="space-y-3">
        {modes.map(({ mode, title, description, icon }) => (
          <button
            key={mode}
            onClick={() => onSelect(mode)}
            className="w-full flex items-center gap-4 p-5 border border-border rounded-lg bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors text-left group"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
