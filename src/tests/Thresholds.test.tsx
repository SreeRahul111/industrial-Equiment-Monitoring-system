import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Modal } from '../components/Modal';

describe('Modal and Threshold Safeguards', () => {
  it('renders Modal when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Configure Machine Threshold">
        <div>Threshold Form Elements</div>
      </Modal>
    );

    expect(screen.getByText('Configure Machine Threshold')).toBeInTheDocument();
    expect(screen.getByText('Threshold Form Elements')).toBeInTheDocument();
  });

  it('does not render Modal when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Configure Machine Threshold">
        <div>Hidden Form</div>
      </Modal>
    );

    expect(container.firstChild).toBeNull();
  });
});
