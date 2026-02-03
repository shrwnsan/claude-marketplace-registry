/**
 * LoadingSpinner Component Tests
 *
 * Tests for the LoadingSpinner component, focusing on:
 * - Different size variants
 * - Custom className support
 * - Accessibility attributes
 * - Proper role and aria labels
 */

import React from 'react';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  describe('Rendering', () => {
    it('should render with default size (md)', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('w-6');
      expect(spinner).toHaveClass('h-6');
    });

    it('should render with small size', () => {
      render(<LoadingSpinner size='sm' />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('w-4');
      expect(spinner).toHaveClass('h-4');
    });

    it('should render with medium size', () => {
      render(<LoadingSpinner size='md' />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('w-6');
      expect(spinner).toHaveClass('h-6');
    });

    it('should render with large size', () => {
      render(<LoadingSpinner size='lg' />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('w-8');
      expect(spinner).toHaveClass('h-8');
    });
  });

  describe('Styling', () => {
    it('should have animation spin class', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should have rounded-full class', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('rounded-full');
    });

    it('should have border classes for spinner effect', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('border-2');
      expect(spinner).toHaveClass('border-gray-300');
      expect(spinner).toHaveClass('border-t-primary-600');
    });

    it('should apply custom className', () => {
      render(<LoadingSpinner className='custom-class' />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('custom-class');
    });

    it('should preserve default classes with custom className', () => {
      render(<LoadingSpinner className='custom-class' />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('animate-spin');
      expect(spinner).toHaveClass('rounded-full');
      expect(spinner).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have status role', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByLabelText('Loading');
      expect(spinner).toBeInTheDocument();
    });

    it('should have screen reader text', () => {
      render(<LoadingSpinner />);

      const srText = screen.getByText('Loading...');
      expect(srText).toBeInTheDocument();
      expect(srText).toHaveClass('sr-only');
    });
  });

  describe('Size Variants', () => {
    it('should apply correct width and height for each size', () => {
      const { rerender } = render(<LoadingSpinner size='sm' />);
      expect(screen.getByRole('status')).toHaveClass('w-4', 'h-4');

      rerender(<LoadingSpinner size='md' />);
      expect(screen.getByRole('status')).toHaveClass('w-6', 'h-6');

      rerender(<LoadingSpinner size='lg' />);
      expect(screen.getByRole('status')).toHaveClass('w-8', 'h-8');
    });
  });

  describe('Edge Cases', () => {
    it('should render without className prop', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('w-6');
    });

    it('should handle empty className', () => {
      render(<LoadingSpinner className='' />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should render multiple spinners independently', () => {
      render(
        <div>
          <LoadingSpinner size='sm' className='spinner1' />
          <LoadingSpinner size='lg' className='spinner2' />
        </div>
      );

      const spinners = screen.getAllByRole('status');
      expect(spinners).toHaveLength(2);

      expect(spinners[0]).toHaveClass('spinner1');
      expect(spinners[1]).toHaveClass('spinner2');
    });
  });

  describe('Visual Structure', () => {
    it('should be a div element', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status');
      expect(spinner.tagName).toBe('DIV');
    });

    it('should contain screen reader only span', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status');
      const srSpan = spinner.querySelector('span');
      expect(srSpan).toBeInTheDocument();
      expect(srSpan).toHaveClass('sr-only');
    });
  });
});
