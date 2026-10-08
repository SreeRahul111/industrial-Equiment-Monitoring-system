import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';

describe('UI Dashboard Components', () => {
  it('renders MetricCard with labels and value correctly', () => {
    render(
      <MetricCard
        label="Machines monitored"
        value={12}
        statusBadge={<StatusBadge status="NORMAL" />}
      />
    );

    expect(screen.getByText('Machines monitored')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('NORMAL')).toBeInTheDocument();
  });

  it('renders StatusBadge with critical and warning indicators', () => {
    const { rerender } = render(<StatusBadge status="CRITICAL" />);
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();

    rerender(<StatusBadge status="WARNING" />);
    expect(screen.getByText('WARNING')).toBeInTheDocument();
  });
});
