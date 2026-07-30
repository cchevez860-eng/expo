'use client';
import * as React from 'react';

import type { NativeStackViewState } from '../types';

export function useDismissedRouteError(state: NativeStackViewState) {
  const [nextDismissedKey, setNextDismissedKey] = React.useState<string | null>(null);
  const activeRoutes = state.routes.slice(0, state.index + 1);

  const dismissedRouteName = nextDismissedKey
    ? activeRoutes.find((route) => route.key === nextDismissedKey)?.name
    : null;

  React.useEffect(() => {
    if (dismissedRouteName) {
      const message =
        `The screen '${dismissedRouteName}' was removed natively but didn't get removed from JS state. ` +
        `This can happen if the screen's 'preventRemove' option changed after native dismissal began.\n\n` +
        `Keep 'preventRemove' enabled until the blocked navigation attempt has completed.`;

      console.error(message);
    }
  }, [dismissedRouteName]);

  return { setNextDismissedKey };
}
