// src/components/ui/ErrorScreen.tsx
// Full-width error display for load and validation failures.
// Splits multi-line messages into individual listed errors.

interface ErrorScreenProps {
  title?: string;
  message: string;
}

export function ErrorScreen({ title = 'An error occurred', message }: ErrorScreenProps) {
  const lines = message.split('\n').filter((l) => l.trim().length > 0);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-card border border-error/30 rounded-2xl p-8 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">⚠️</span>
          <h1 className="text-xl font-bold text-text-base">{title}</h1>
        </div>
        {lines.length === 1 ? (
          <p className="text-text-muted text-sm leading-relaxed">{lines[0]}</p>
        ) : (
          <ul className="space-y-1.5">
            {lines.map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                <span className="text-error mt-0.5 shrink-0">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
