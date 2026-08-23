// src/components/nodes/FallbackNodeView.tsx
// Displayed when a node type is not handled by any registered renderer.
// Shows the unknown type string and a "not supported" message.
// Never throws regardless of node shape.

interface FallbackNodeViewProps {
  node: { type: string; title?: string; [key: string]: unknown };
  onAdvance: () => void;
}

export function FallbackNodeView({ node, onAdvance }: FallbackNodeViewProps) {
  return (
    <div className="space-y-4">
      <div className="bg-warning/10 border border-warning/20 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">⚙️</span>
          <span className="text-warning font-semibold">Node type not supported</span>
        </div>
        <p className="text-text-muted text-sm">
          This node uses the type{' '}
          <code className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-text-base">
            {node.type}
          </code>{' '}
          which is not supported by this version of the Lesson Engine.
        </p>
        {node.title !== undefined && (
          <p className="text-text-muted text-sm">
            Title: <span className="text-text-base">{node.title}</span>
          </p>
        )}
      </div>
      <button
        onClick={onAdvance}
        className="text-sm text-text-muted hover:text-text-base underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
      >
        Skip and continue →
      </button>
    </div>
  );
}
