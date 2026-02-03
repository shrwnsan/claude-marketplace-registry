/**
 * Feedback Widget for Ecosystem Statistics
 * Collects user feedback, satisfaction ratings, and suggestions
 */

import React, { useState, useEffect, useRef } from 'react';
import { Star, MessageCircle, X, Minimize2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useEcosystemAnalytics } from '../../hooks/useEcosystemAnalytics';
import { generateSecureId } from '../../utils/crypto';

interface FeedbackData {
  rating: number;
  satisfaction: 'very-satisfied' | 'satisfied' | 'neutral' | 'dissatisfied' | 'very-dissatisfied';
  category: 'general' | 'ui' | 'performance' | 'data-quality' | 'feature-request' | 'bug-report';
  message: string;
  email?: string;
  userAgent: string;
  timestamp: number;
  sessionId: string;
  context?: {
    component?: string;
    action?: string;
    metric?: string;
  };
}

interface FeedbackWidgetProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showByDefault?: boolean;
  autoShowAfter?: number; // seconds
  theme?: 'light' | 'dark' | 'auto';
}

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  className = '',
  position = 'bottom-right',
  showByDefault = false,
  autoShowAfter = 30,
  theme = 'auto',
}) => {
  const { trackEcosystemInteraction, trackFeatureUsage, trackError } = useEcosystemAnalytics();
  const [isOpen, setIsOpen] = useState(showByDefault);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentStep, setCurrentStep] = useState<'closed' | 'rating' | 'details' | 'confirmation'>(
    'closed'
  );
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<FeedbackData['category']>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const autoShowTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Auto-show after specified time
    if (autoShowAfter > 0 && !showByDefault) {
      autoShowTimerRef.current = setTimeout(() => {
        setIsOpen(true);
        trackEcosystemInteraction('feedback_auto_show', 'auto-trigger');
      }, autoShowAfter * 1000);
    }

    return () => {
      if (autoShowTimerRef.current) {
        clearTimeout(autoShowTimerRef.current);
      }
    };
  }, [autoShowAfter, showByDefault, trackEcosystemInteraction]);

  const getSatisfactionFromRating = (rating: number): FeedbackData['satisfaction'] => {
    if (rating >= 5) return 'very-satisfied';
    if (rating >= 4) return 'satisfied';
    if (rating >= 3) return 'neutral';
    if (rating >= 2) return 'dissatisfied';
    return 'very-dissatisfied';
  };

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
    setCurrentStep('details');
    trackFeatureUsage('feedback_rating', Date.now());
  };

  const handleSubmit = async () => {
    if (!rating || !message.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    const feedbackData: FeedbackData = {
      rating,
      satisfaction: getSatisfactionFromRating(rating),
      category,
      message: message.trim(),
      email: email.trim() || undefined,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      sessionId: generateSessionId(),
    };

    try {
      // Send feedback to backend
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setCurrentStep('confirmation');
        trackEcosystemInteraction('feedback_submit', 'success', rating);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      setSubmitStatus('error');
      trackError(error as Error, { context: 'feedback_submission' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSessionId = (): string => {
    let sessionId = sessionStorage.getItem('feedback_session_id');
    if (!sessionId) {
      const randomPart = generateSecureId(9);
      sessionId = `feedback_${Date.now()}_${randomPart}`;
      sessionStorage.setItem('feedback_session_id', sessionId);
    }
    return sessionId;
  };

  const resetForm = () => {
    setRating(0);
    setCategory('general');
    setMessage('');
    setEmail('');
    setSubmitStatus('idle');
    setCurrentStep('rating');
  };

  const closeWidget = () => {
    setIsOpen(false);
    setCurrentStep('closed');
    trackEcosystemInteraction('feedback_close', 'user-action');
  };

  const minimizeWidget = () => {
    setIsMinimized(true);
    trackEcosystemInteraction('feedback_minimize', 'user-action');
  };

  const maximizeWidget = () => {
    setIsMinimized(false);
    trackEcosystemInteraction('feedback_maximize', 'user-action');
  };

  const getPositionClasses = (): string => {
    const baseClasses = 'fixed z-50 transition-all duration-300 ease-in-out';

    switch (position) {
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      default:
        return `${baseClasses} bottom-4 right-4`;
    }
  };

  const getThemeClasses = (): string => {
    if (theme === 'auto') {
      return 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700';
    }
    return theme === 'dark'
      ? 'bg-gray-800 text-gray-100 border-gray-700'
      : 'bg-white text-gray-900 border-gray-200';
  };

  if (!isOpen) {
    return null;
  }

  const widgetClasses = `
    ${getPositionClasses()}
    ${getThemeClasses()}
    ${className}
    ${isMinimized ? 'w-12 h-12' : 'w-80 max-w-sm'}
    rounded-lg shadow-lg border
  `;

  return (
    <div className={widgetClasses}>
      {!isMinimized ? (
        <div className='flex flex-col'>
          {/* Header */}
          <div className='flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700'>
            <div className='flex items-center gap-2'>
              <MessageCircle className='w-4 h-4' />
              <span className='font-medium text-sm'>Feedback</span>
            </div>
            <div className='flex items-center gap-1'>
              <button
                onClick={minimizeWidget}
                className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                aria-label='Minimize feedback'
              >
                <Minimize2 className='w-4 h-4' />
              </button>
              <button
                onClick={closeWidget}
                className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                aria-label='Close feedback'
              >
                <X className='w-4 h-4' />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className='p-4'>
            {currentStep === 'rating' && (
              <div className='space-y-4'>
                <div>
                  <h3 className='font-medium text-sm mb-2'>How would you rate your experience?</h3>
                  <div className='flex justify-center gap-2'>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingClick(star)}
                        className={`p-1 rounded-lg transition-all duration-200 hover:scale-110 ${
                          rating >= star ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                        }`}
                        aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                      >
                        <Star className='w-6 h-6' fill={rating >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className='text-center'>
                  <button
                    onClick={closeWidget}
                    className='text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  >
                    No thanks
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'details' && (
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium mb-2'>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FeedbackData['category'])}
                    className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm'
                  >
                    <option value='general'>General Feedback</option>
                    <option value='ui'>UI/UX</option>
                    <option value='performance'>Performance</option>
                    <option value='data-quality'>Data Quality</option>
                    <option value='feature-request'>Feature Request</option>
                    <option value='bug-report'>Bug Report</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium mb-2'>Tell us more</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's on your mind? (optional)"
                    className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm resize-none'
                    rows={3}
                    maxLength={500}
                  />
                  <div className='text-right text-xs text-gray-500 mt-1'>{message.length}/500</div>
                </div>

                <div>
                  <label className='block text-sm font-medium mb-2'>Email (optional)</label>
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='your@email.com'
                    className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm'
                  />
                </div>

                <div className='flex gap-2'>
                  <button
                    onClick={handleSubmit}
                    disabled={!rating || !message.trim() || isSubmitting}
                    className='flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium'
                  >
                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                  </button>
                  <button
                    onClick={resetForm}
                    className='px-3 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm'
                  >
                    Back
                  </button>
                </div>

                {submitStatus === 'error' && (
                  <div className='flex items-center gap-2 text-red-600 dark:text-red-400 text-sm'>
                    <AlertTriangle className='w-4 h-4' />
                    <span>Failed to send feedback. Please try again.</span>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'confirmation' && (
              <div className='text-center space-y-3'>
                <div className='flex justify-center'>
                  <CheckCircle className='w-12 h-12 text-green-600 dark:text-green-400' />
                </div>
                <h3 className='font-medium'>Thank you for your feedback!</h3>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Your feedback helps us improve the ecosystem statistics.
                </p>
                <button
                  onClick={closeWidget}
                  className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm'
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Minimized state */
        <button
          onClick={maximizeWidget}
          className='w-full h-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg'
          aria-label='Expand feedback'
        >
          <MessageCircle className='w-5 h-5' />
        </button>
      )}
    </div>
  );
};

export default FeedbackWidget;
