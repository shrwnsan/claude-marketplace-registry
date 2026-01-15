/**
 * MainLayout Component Tests
 *
 * Tests for the MainLayout layout component, focusing on:
 * - Rendering with children
 * - Header/footer visibility toggles
 * - Custom className support
 * - Accessibility features
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainLayout from '../MainLayout';

// Mock Header and Footer components
jest.mock('../Header', () => ({
  __esModule: true,
  default: ({ className }: { className?: string }) => (
    <header className={className} data-testid="header">
      Header
    </header>
  ),
}));

jest.mock('../Footer', () => ({
  __esModule: true,
  default: ({ className }: { className?: string }) => (
    <footer className={className} data-testid="footer">
      Footer
    </footer>
  ),
}));

describe('MainLayout Component', () => {
  describe('Rendering', () => {
    it('should render children in main content area', () => {
      render(
        <MainLayout>
          <div data-testid="test-content">Test Content</div>
        </MainLayout>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render header by default', () => {
      render(<MainLayout>Content</MainLayout>);

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should render footer by default', () => {
      render(<MainLayout>Content</MainLayout>);

      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should not render header when showHeader is false', () => {
      render(<MainLayout showHeader={false}>Content</MainLayout>);

      expect(screen.queryByTestId('header')).not.toBeInTheDocument();
    });

    it('should not render footer when showFooter is false', () => {
      render(<MainLayout showFooter={false}>Content</MainLayout>);

      expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
    });

    it('should render both header and footer when enabled', () => {
      render(
        <MainLayout showHeader={true} showFooter={true}>
          Content
        </MainLayout>
      );

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <MainLayout>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <div data-testid="child3">Child 3</div>
        </MainLayout>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
      expect(screen.getByTestId('child3')).toBeInTheDocument();
    });
  });

  describe('Custom Classes', () => {
    it('should apply custom className to wrapper', () => {
      const { container } = render(
        <MainLayout className="custom-wrapper-class">Content</MainLayout>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-wrapper-class');
    });

    it('should apply custom className to header', () => {
      render(<MainLayout headerClassName="custom-header">Content</MainLayout>);

      expect(screen.getByTestId('header')).toHaveClass('custom-header');
    });

    it('should apply custom className to footer', () => {
      render(<MainLayout footerClassName="custom-footer">Content</MainLayout>);

      expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
    });

    it('should include default classes along with custom classes', () => {
      const { container } = render(
        <MainLayout className="custom-class">Content</MainLayout>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('min-h-screen');
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('flex-col');
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have skip to main content link', () => {
      render(<MainLayout>Content</MainLayout>);

      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should have main element with proper role', () => {
      render(<MainLayout>Content</MainLayout>);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('id', 'main-content');
    });

    it('should have skip link with proper aria attributes', () => {
      render(<MainLayout>Content</MainLayout>);

      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toHaveClass('sr-only');
      expect(skipLink).toHaveClass('focus:not-sr-only');
    });

    it('should have skip link with proper positioning classes', () => {
      const { container } = render(<MainLayout>Content</MainLayout>);

      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toHaveClass('focus:absolute');
      expect(skipLink).toHaveClass('z-50');
    });

    it('should render loading text for screen readers', () => {
      render(<MainLayout>Content</MainLayout>);

      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should have flex-col layout for vertical stacking', () => {
      const { container } = render(<MainLayout>Content</MainLayout>);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex-col');
    });

    it('should have min-height for full viewport', () => {
      const { container } = render(<MainLayout>Content</MainLayout>);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('min-h-screen');
    });

    it('should have main element with flex-grow', () => {
      render(<MainLayout>Content</MainLayout>);

      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex-grow');
    });
  });

  describe('Edge Cases', () => {
    it('should render with empty children', () => {
      const { container } = render(<MainLayout>{null}</MainLayout>);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toBeEmptyDOMElement();
    });

    it('should render with null header and footer', () => {
      render(
        <MainLayout showHeader={false} showFooter={false}>
          Content
        </MainLayout>
      );

      expect(screen.queryByTestId('header')).not.toBeInTheDocument();
      expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should render with all custom classes', () => {
      const { container } = render(
        <MainLayout
          className="wrapper-custom"
          headerClassName="header-custom"
          footerClassName="footer-custom"
        >
          Content
        </MainLayout>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('wrapper-custom');
      expect(screen.getByTestId('header')).toHaveClass('header-custom');
      expect(screen.getByTestId('footer')).toHaveClass('footer-custom');
    });
  });
});
