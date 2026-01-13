/**
 * Smooth scrolling utility functions
 *
 * Provides utilities for smooth scrolling behavior and anchor link handling
 * to improve navigation experience within the application.
 */

/**
 * Smooth scrolling to an element by ID
 *
 * @param elementId - The ID of the element to scroll to (without #)
 * @param offset - Optional offset from the top in pixels (default: 0)
 */
export const smoothScrollTo = (elementId: string, offset: number = 0): void => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  }
};

/**
 * Handle anchor link clicks with smooth scrolling
 *
 * Updates the URL without page reload and scrolls smoothly to the target section.
 * Use this as the onClick handler for anchor links.
 *
 * @param e - The click event from the anchor element
 * @param offset - Optional offset from the top in pixels (default: 0)
 *
 * @example
 * ```tsx
 * <a
 *   href="#analytics-dashboard"
 *   onClick={(e) => handleAnchorClick(e)}
 *   className="..."
 * >
 *   Ecosystem Statistics
 * </a>
 * ```
 */
export const handleAnchorClick = (
  e: React.MouseEvent<HTMLAnchorElement>,
  offset: number = 0
): void => {
  e.preventDefault();
  const href = e.currentTarget.getAttribute('href');
  if (href && href.startsWith('#')) {
    const elementId = href.substring(1);
    smoothScrollTo(elementId, offset);

    // Update URL without page reload
    window.history.pushState(null, '', href);
  }
};

/**
 * Scroll to top of page with smooth animation
 *
 * Useful for "back to top" buttons or page navigation.
 */
export const scrollToTop = (): void => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

/**
 * Check if an element is currently visible in the viewport
 *
 * @param elementId - The ID of the element to check (without #)
 * @returns true if the element is visible in the viewport
 */
export const isElementInViewport = (elementId: string): boolean => {
  const element = document.getElementById(elementId);
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};
