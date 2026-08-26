import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChallengeSolution } from './ChallengeSolution';

const solution = {
  language: 'javascript',
  code: 'console.log("done");',
  explanation: 'Shows the final completed challenge code.',
};

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
    configurable: true,
  });
});

describe('ChallengeSolution', () => {
  it('renders solution language, explanation, and formatted code', () => {
    render(<ChallengeSolution solution={solution} />);

    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.getByText(solution.explanation)).toBeInTheDocument();
    expect(screen.getByText(solution.code)).toBeInTheDocument();
  });

  it('copies solution code to the clipboard', async () => {
    render(<ChallengeSolution solution={solution} />);

    fireEvent.click(screen.getByRole('button', { name: /copy full solution code/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(solution.code);
    });
  });

  it('shows a neutral unavailable message when no solution exists', () => {
    render(<ChallengeSolution solution={undefined} />);

    expect(
      screen.getByText('An example solution is not available for this challenge.')
    ).toBeInTheDocument();
  });
});
