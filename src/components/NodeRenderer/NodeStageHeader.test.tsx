import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NodeStageHeader } from './NodeStageHeader';
import type { LearningNode } from '@/types/lesson';

const node = {
  id: 'node-01',
  type: 'code',
  title: 'Membuat Kode Pertama',
} as LearningNode;

describe('NodeStageHeader', () => {
  it('communicates the current checkpoint and node identity', () => {
    render(
      <NodeStageHeader
        node={node}
        nodeIndex={1}
        totalNodes={5}
        isRevisit={false}
      />
    );

    expect(screen.getByRole('heading', { name: 'Membuat Kode Pertama' })).toBeInTheDocument();
    expect(screen.getByText('Current Stage')).toBeInTheDocument();
    expect(screen.getByText('Checkpoint 2 of 5')).toBeInTheDocument();
    expect(screen.getByText('Coding')).toBeInTheDocument();
  });

  it('communicates a read-only revisit state', () => {
    render(
      <NodeStageHeader
        node={node}
        nodeIndex={1}
        totalNodes={5}
        isRevisit
      />
    );

    expect(screen.getByText('Reviewing')).toBeInTheDocument();
  });
});
