/**
 * SkeletonCard Component Tests
 *
 * Tests for the SkeletonCard loading placeholder component, focusing on:
 * - Rendering structure
 * - Custom className support
 * - Animation behavior
 * - Proper semantic structure
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkeletonCard from '../SkeletonCard';

describe('SkeletonCard Component', () => {
  describe('Rendering', () => {
    it('should render skeleton card container', () => {
      const { container } = render(<SkeletonCard />);

      const card = container.querySelector('.card');
      expect(card).toBeInTheDocument();
    });

    it('should render with pulse animation', () => {
      const { container } = render(<SkeletonCard />);

      const animatedContainer = container.querySelector('.animate-pulse');
      expect(animatedContainer).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<SkeletonCard className="custom-skeleton" />);

      const card = container.querySelector('.custom-skeleton');
      expect(card).toBeInTheDocument();
    });

    it('should preserve default classes with custom className', () => {
      const { container } = render(<SkeletonCard className="custom-class" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('card');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Skeleton Structure', () => {
    it('should render header skeleton with title and description lines', () => {
      const { container } = render(<SkeletonCard />);

      const titleSkeleton = container.querySelectorAll('.h-6')[0];
      const descSkeletons = container.querySelectorAll('.h-4');

      expect(titleSkeleton).toBeInTheDocument();
      expect(descSkeletons.length).toBeGreaterThan(0);
    });

    it('should render tags skeleton section', () => {
      const { container } = render(<SkeletonCard />);

      const tagSkeletons = container.querySelectorAll('.h-6.bg-gray-200');
      expect(tagSkeletons.length).toBeGreaterThan(0);
    });

    it('should render author section skeleton', () => {
      const { container } = render(<SkeletonCard />);

      const authorSkeletons = container.querySelectorAll('.h-4');
      expect(authorSkeletons.length).toBeGreaterThan(0);
    });

    it('should render stats section skeleton', () => {
      const { container } = render(<SkeletonCard />);

      const statSkeletons = container.querySelectorAll('.h-4');
      expect(statSkeletons.length).toBeGreaterThan(0);
    });

    it('should render actions section skeleton', () => {
      const { container } = render(<SkeletonCard />);

      const actionSkeletons = container.querySelectorAll('.h-8');
      expect(actionSkeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Layout Structure', () => {
    it('should have header section with flex layout', () => {
      const { container } = render(<SkeletonCard />);

      const headerSection = container.querySelector('.flex.items-start.justify-between');
      expect(headerSection).toBeInTheDocument();
    });

    it('should have tags section with horizontal layout', () => {
      const { container } = render(<SkeletonCard />);

      const tagsSection = container.querySelectorAll('.flex')[1];
      expect(tagsSection).toBeInTheDocument();
      expect(tagsSection).toHaveClass('space-x-2');
    });

    it('should have author section with justify-between', () => {
      const { container } = render(<SkeletonCard />);

      const authorSection = container.querySelectorAll('.flex.items-center.justify-between')[0];
      expect(authorSection).toBeInTheDocument();
    });

    it('should have stats section with nested flex', () => {
      const { container } = render(<SkeletonCard />);

      const statsSection = container.querySelectorAll('.flex.items-center.justify-between')[1];
      expect(statsSection).toBeInTheDocument();
    });

    it('should have actions section with border top', () => {
      const { container } = render(<SkeletonCard />);

      const actionsSection = container.querySelector('.flex.items-center.justify-between.pt-4');
      expect(actionsSection).toBeInTheDocument();
    });
  });

  describe('Skeleton Elements', () => {
    it('should render correct number of skeleton elements', () => {
      const { container } = render(<SkeletonCard />);

      // Count all skeleton elements (gray backgrounds)
      const skeletons = container.querySelectorAll('.bg-gray-200');
      expect(skeletons.length).toBeGreaterThan(10);
    });

    it('should have properly sized skeleton elements', () => {
      const { container } = render(<SkeletonCard />);

      // Check for various heights
      expect(container.querySelector('.h-4')).toBeInTheDocument();
      expect(container.querySelector('.h-5')).toBeInTheDocument();
      expect(container.querySelector('.h-6')).toBeInTheDocument();
      expect(container.querySelector('.h-8')).toBeInTheDocument();
    });

    it('should have rounded corners on skeleton elements', () => {
      const { container } = render(<SkeletonCard />);

      const roundedElements = container.querySelectorAll('.rounded');
      expect(roundedElements.length).toBeGreaterThan(0);
    });

    it('should have width variants for skeleton elements', () => {
      const { container } = render(<SkeletonCard />);

      expect(container.querySelector('.w-3\\/4')).toBeInTheDocument();
      expect(container.querySelector('.w-5\\/6')).toBeInTheDocument();
      expect(container.querySelector('.w-full')).toBeInTheDocument();
    });
  });

  describe('Spacing and Layout', () => {
    it('should have proper margin bottom on header section', () => {
      const { container } = render(<SkeletonCard />);

      const headerSection = container.querySelector('.mb-4');
      expect(headerSection).toBeInTheDocument();
    });

    it('should have margin between sections', () => {
      const { container } = render(<SkeletonCard />);

      const mbSections = container.querySelectorAll('.mb-4');
      expect(mbSections.length).toBeGreaterThan(1);
    });

    it('should have proper spacing in flex layouts', () => {
      const { container } = render(<SkeletonCard />);

      const spaceXElements = container.querySelectorAll('.space-x-2');
      const spaceX4Elements = container.querySelectorAll('.space-x-4');

      expect(spaceXElements.length).toBeGreaterThan(0);
      expect(spaceX4Elements.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Styles', () => {
    it('should use gray-200 color for skeleton elements', () => {
      const { container } = render(<SkeletonCard />);

      const grayElements = container.querySelectorAll('.bg-gray-200');
      expect(grayElements.length).toBeGreaterThan(0);
    });

    it('should use gray-100 for border', () => {
      const { container } = render(<SkeletonCard />);

      const borderElement = container.querySelector('.border-gray-100');
      expect(borderElement).toBeInTheDocument();
    });

    it('should have proper border styling on actions section', () => {
      const { container } = render(<SkeletonCard />);

      const borderElement = container.querySelector('.border-t');
      expect(borderElement).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should render without className', () => {
      const { container } = render(<SkeletonCard />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('card');
    });

    it('should handle empty className', () => {
      const { container } = render(<SkeletonCard className="" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toBeInTheDocument();
    });

    it('should render multiple skeleton cards independently', () => {
      const { container } = render(
        <div>
          <SkeletonCard className="card1" />
          <SkeletonCard className="card2" />
        </div>
      );

      const cards = container.querySelectorAll('.card');
      expect(cards.length).toBe(2);
    });
  });
});
