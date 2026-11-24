import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { useWorkflowStore } from '../store/workflowStore';
import { App } from './App';

describe('App routes', () => {
  beforeEach(() => {
    useWorkflowStore.getState().reset();
  });

  it('redirects a direct editor visit to upload when no photos exist', async () => {
    render(
      <MemoryRouter initialEntries={['/editor']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: '把这一刻，排成更好看的朋友圈' }),
    ).toBeInTheDocument();
  });
});
