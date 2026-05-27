import { useEffect } from 'react';
import useDesignStore from '../store/useDesignStore';

export function useHistoryRouter() {
  const hydrateRouteFromUrl = useDesignStore(s => s.hydrateRouteFromUrl);
  const setRoute = useDesignStore(s => s.setRoute);

  useEffect(() => {
    // 1. Initial hydration of route based on the window.location on mount
    hydrateRouteFromUrl();

    // 2. Listen to native browser Back and Forward navigation events
    const handlePopState = (event) => {
      if (event.state && event.state.route) {
        // Hydrate routing state without pushing a new entry onto the history stack
        setRoute(event.state.route, event.state.params, true);
      } else {
        hydrateRouteFromUrl();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hydrateRouteFromUrl, setRoute]);
}
