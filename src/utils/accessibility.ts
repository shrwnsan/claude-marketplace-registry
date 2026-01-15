/**
 * Accessibility utilities for ensuring WCAG 2.1 AA compliance
 */

/**
 * Announce messages to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Generate unique IDs for accessibility attributes
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Focus trap for modals and dialogs
 */
export class FocusTrap {
  private container: HTMLElement;
  private previousFocus: HTMLElement | null = null;
  private keydownHandler: (e: KeyboardEvent) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.keydownHandler = this.handleKeydown.bind(this);
  }

  activate() {
    // Store current focus
    this.previousFocus = document.activeElement as HTMLElement;

    // Add keydown listener
    this.container.addEventListener('keydown', this.keydownHandler);

    // Focus first focusable element
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  deactivate() {
    // Remove keydown listener
    this.container.removeEventListener('keydown', this.keydownHandler);

    // Restore previous focus
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(this.container.querySelectorAll(selector)) as HTMLElement[];
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      const focusableElements = this.getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }
}

/**
 * Skip links for keyboard navigation
 */
export function createSkipLinks() {
  const skipLinks = [
    { href: '#main-content', text: 'Skip to main content' },
    { href: '#navigation', text: 'Skip to navigation' },
    { href: '#search', text: 'Skip to search' },
  ];

  const skipLinksContainer = document.createElement('div');
  skipLinksContainer.className = 'fixed top-0 left-0 z-50 flex flex-col p-2';

  skipLinks.forEach((link) => {
    const skipLink = document.createElement('a');
    skipLink.href = link.href;
    skipLink.textContent = link.text;
    skipLink.className =
      'sr-only focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 bg-primary-600 text-white px-4 py-2 rounded-md mb-2';
    skipLinksContainer.appendChild(skipLink);
  });

  document.body.insertBefore(skipLinksContainer, document.body.firstChild);
}

/**
 * Check color contrast for WCAG compliance
 */
export function checkColorContrast(
  foreground: string,
  background: string
): { ratio: number; wcagAA: boolean; wcagAAA: boolean } {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const rgb1 = hexToRgb(foreground);
  const rgb2 = hexToRgb(background);

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  const ratio = (brightest + 0.05) / (darkest + 0.05);

  return {
    ratio,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7,
  };
}

/**
 * Keyboard navigation enhancements
 */
export function enhanceKeyboardNavigation() {
  // Add keyboard support for custom dropdowns
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close any open modals or dropdowns
      const openElements = document.querySelectorAll('[data-open="true"]');
      openElements.forEach((element) => {
        (element as HTMLElement).dataset.open = 'false';
      });
    }
  });

  // Add focus visible styling
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });
}

/**
 * ARIA live region manager
 */
export class AriaLiveRegion {
  private element: HTMLElement;

  constructor(priority: 'polite' | 'assertive' = 'polite') {
    this.element = document.createElement('div');
    this.element.setAttribute('aria-live', priority);
    this.element.setAttribute('aria-atomic', 'true');
    this.element.className = 'sr-only';
    document.body.appendChild(this.element);
  }

  announce(message: string) {
    this.element.textContent = '';
    // Force screen reader to announce
    setTimeout(() => {
      this.element.textContent = message;
    }, 100);
  }

  destroy() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

/**
 * Heading structure validator
 */
export function validateHeadingStructure(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for multiple h1s
  const h1s = headings.filter((h) => h.tagName === 'H1');
  if (h1s.length > 1) {
    errors.push('Multiple H1 headings found. There should be only one H1 per page.');
  }

  // Check heading hierarchy
  let previousLevel = 0;
  headings.forEach((heading) => {
    const currentLevel = parseInt(heading.tagName.charAt(1));

    if (previousLevel > 0 && currentLevel > previousLevel + 1) {
      warnings.push(
        `Heading level skipped: H${previousLevel} to H${currentLevel} at "${heading.textContent}"`
      );
    }

    previousLevel = currentLevel;
  });

  // Check for empty headings
  headings.forEach((heading) => {
    if (!heading.textContent?.trim()) {
      warnings.push(`Empty ${heading.tagName} found.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Image accessibility validator
 */
export function validateImageAccessibility(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const images = Array.from(document.querySelectorAll('img'));
  const errors: string[] = [];
  const warnings: string[] = [];

  images.forEach((img, index) => {
    const alt = img.getAttribute('alt');

    if (alt === null) {
      errors.push(`Image ${index + 1} is missing alt attribute.`);
    } else if (alt === '') {
      // Check if image is decorative
      if (img.src && !img.src.includes('placeholder') && !img.src.includes('icon')) {
        warnings.push(`Image ${index + 1} has empty alt text but appears to be content.`);
      }
    } else if (alt.length > 125) {
      warnings.push(
        `Image ${index + 1} alt text is very long (${alt.length} characters). Consider using a description.`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Link accessibility validator
 */
export function validateLinkAccessibility(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const links = Array.from(document.querySelectorAll('a'));
  const errors: string[] = [];
  const warnings: string[] = [];

  links.forEach((link, index) => {
    const text = link.textContent?.trim();
    const href = link.getAttribute('href');

    if (!text && !link.querySelector('img')) {
      errors.push(`Link ${index + 1} has no accessible text.`);
    }

    if (text && text.toLowerCase().includes('click here')) {
      warnings.push(`Link ${index + 1} uses "click here" text. Use more descriptive text.`);
    }

    if (href === '#' || href === '') {
      warnings.push(`Link ${index + 1} has empty or placeholder href.`);
    }

    // Check if link opens in new window without warning
    if (link.getAttribute('target') === '_blank') {
      const ariaLabel = link.getAttribute('aria-label') || link.getAttribute('title');
      if (!ariaLabel?.toLowerCase().includes('new window')) {
        warnings.push(`Link ${index + 1} opens in new window but doesn't warn user.`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Run comprehensive accessibility audit
 */
export function runAccessibilityAudit(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    headings: ReturnType<typeof validateHeadingStructure>;
    images: ReturnType<typeof validateImageAccessibility>;
    links: ReturnType<typeof validateLinkAccessibility>;
  };
} {
  return {
    isValid: false,
    errors: [],
    warnings: [],
    checks: {
      headings: validateHeadingStructure(),
      images: validateImageAccessibility(),
      links: validateLinkAccessibility(),
    },
  };
}

// Initialize accessibility features
if (typeof window !== 'undefined') {
  // Create skip links
  createSkipLinks();

  // Enhance keyboard navigation
  enhanceKeyboardNavigation();

  // Run accessibility audit in development
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      const audit = runAccessibilityAudit();
      if (audit.errors.length > 0 || audit.warnings.length > 0) {
        console.group('Accessibility Audit Results');
        if (audit.errors.length > 0) {
          console.error('Errors:', audit.errors);
        }
        if (audit.warnings.length > 0) {
          console.warn('Warnings:', audit.warnings);
        }
        console.log('Full audit:', audit.checks);
        console.groupEnd();
      }
    }, 2000);
  }
}
