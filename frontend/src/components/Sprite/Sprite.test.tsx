import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sprite } from './Sprite';

describe('Sprite', () => {
  it('shows the generated image', () => {
    render(<Sprite name="wumpus" label="Wumpus" />);

    expect(screen.getByRole('img', { name: 'Wumpus' }).tagName).toBe('IMG');
  });

  it('falls back to a vector drawing when the image fails to load', () => {
    render(<Sprite name="pit" label="Poço" />);

    fireEvent.error(screen.getByRole('img', { name: 'Poço' }));

    const fallback = screen.getByRole('img', { name: 'Poço' });
    expect(fallback.tagName.toLowerCase()).toBe('svg');
    expect(fallback).toHaveAttribute('data-fallback', 'true');
  });
});
