import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WhiteLabelProvider, useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { AuthProvider } from '@/contexts/AuthContext';

function TestComponent() {
  const { config, loading, isFeatureEnabled } = useWhiteLabel();
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'ready'}</div>
      <div data-testid="brand-name">{config.brand_name}</div>
      <div data-testid="primary-color">{config.primary_color}</div>
      <div data-testid="ab-testing">{isFeatureEnabled('ab_testing') ? 'enabled' : 'disabled'}</div>
    </div>
  );
}

describe('WhiteLabelContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides default config values', async () => {
    render(
      <AuthProvider>
        <WhiteLabelProvider>
          <TestComponent />
        </WhiteLabelProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    expect(screen.getByTestId('brand-name')).toHaveTextContent('Newsletter Wizard');
    expect(screen.getByTestId('primary-color')).toHaveTextContent('#6366f1');
  });

  it('reports feature flags correctly', async () => {
    render(
      <AuthProvider>
        <WhiteLabelProvider>
          <TestComponent />
        </WhiteLabelProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('ab-testing')).toHaveTextContent('enabled');
    });
  });
});
