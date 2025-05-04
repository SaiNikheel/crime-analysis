import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { analytics } from '@/lib/firebase';
import { logEvent } from 'firebase/analytics';

export function useAnalytics() {
  const { data: session } = useSession();

  // Track page views
  useEffect(() => {
    const trackPageView = async () => {
      const analyticsInstance = await analytics;
      if (analyticsInstance && session?.user) {
        logEvent(analyticsInstance, 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          user_id: session.user.email,
          user_name: session.user.name
        });
      }
    };

    trackPageView();
  }, [session]);

  // Function to track custom events
  const trackEvent = async (eventName: string, eventParams?: Record<string, any>) => {
    const analyticsInstance = await analytics;
    if (analyticsInstance && session?.user) {
      logEvent(analyticsInstance, eventName, {
        ...eventParams,
        user_id: session.user.email,
        user_name: session.user.name
      });
    }
  };

  return { trackEvent };
} 