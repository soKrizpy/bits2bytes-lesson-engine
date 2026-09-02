'use client';

// src/components/ModuleSwitcher/ModuleSwitcher.tsx
// Displays a list of all modules assigned to a student, with visual distinction
// between active and paused modules.
//
// Paused modules: greyed-out, non-interactive, labelled "Sedang Dijeda".
// Active modules: normal appearance, clickable, keyboard accessible.

import { useEngineTranslations } from '@/hooks/useEngineTranslations';
import type { LmsModule } from '@/types/module';

interface ModuleSwitcherProps {
  modules: LmsModule[];
  activeModuleId: number | null;
  onSelectModule: (moduleId: number) => void;
}

export function ModuleSwitcher({ modules, activeModuleId, onSelectModule }: ModuleSwitcherProps) {
  const t = useEngineTranslations();

  return (
    <nav aria-label={t('module.switcher.aria')} className="flex flex-col gap-2 p-4">
      {modules.map((mod) => {
        const isPaused = mod.status === 'paused';
        const isSelected = mod.id === activeModuleId;

        return (
          <div
            key={mod.id}
            className={[
              'rounded-xl border p-3 transition-all',
              isPaused
                ? 'opacity-50 border-white/10 bg-white/5 cursor-not-allowed'
                : isSelected
                  ? 'border-primary/50 bg-primary/10 cursor-pointer'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer',
            ].join(' ')}
            onClick={() => !isPaused && onSelectModule(mod.id)}
            role={isPaused ? undefined : 'button'}
            aria-disabled={isPaused}
            tabIndex={isPaused ? -1 : 0}
            onKeyDown={(e) => {
              if (!isPaused && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onSelectModule(mod.id);
              }
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-sm font-semibold truncate ${
                  isPaused ? 'text-text-muted' : 'text-text-base'
                }`}
              >
                {mod.title}
              </span>
              {isPaused && (
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-text-muted">
                  {t('module.paused')}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
