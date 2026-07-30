'use client';
import { nanoid } from 'nanoid/non-secure';
import * as React from 'react';

import useLatestCallback from '../../utils/useLatestCallback';
import type { NavigationAction } from '../routers';
import type { EventListenerCallback, EventMapCore } from './types';
import { useNavigation } from './useNavigation';
import { useRoute } from './useRoute';

const registry = new WeakMap<object, Map<string, Set<string>>>();

const getRegistrations = (navigation: object) => {
  let registrations = registry.get(navigation);
  if (!registrations) {
    registrations = new Map();
    registry.set(navigation, registrations);
  }
  return registrations;
};

const syncOption = (
  navigation: { setOptions(options: { preventRemove: boolean }): void },
  routeKey: string
) => {
  navigation.setOptions({
    preventRemove: Boolean(getRegistrations(navigation).get(routeKey)?.size),
  });
};

/**
 * Prevents the screen from being removed while `preventRemove` is `true`.
 * The hook writes the `preventRemove` screen option, so manually setting the same option is last-wins.
 *
 * @param preventRemove Boolean indicating whether to prevent screen from being removed.
 * @param callback Function which is executed when screen was prevented from being removed.
 */
export function usePreventRemove(
  preventRemove: boolean,
  callback: (options: { data: { action: NavigationAction } }) => void
) {
  const [id] = React.useState(() => nanoid());
  const navigation = useNavigation();
  const { key: routeKey } = useRoute();

  React.useEffect(() => {
    const registry = getRegistrations(navigation);
    const registrations = registry.get(routeKey) ?? new Set<string>();
    if (preventRemove) {
      registrations.add(id);
      registry.set(routeKey, registrations);
    } else {
      registrations.delete(id);
      if (registrations.size === 0) {
        registry.delete(routeKey);
      }
    }
    syncOption(navigation, routeKey);

    return () => {
      const registrations = registry.get(routeKey);
      registrations?.delete(id);
      if (registrations?.size === 0) {
        registry.delete(routeKey);
      }
      syncOption(navigation, routeKey);
    };
  }, [id, navigation, preventRemove, routeKey]);

  const removePreventedListener = useLatestCallback<
    EventListenerCallback<EventMapCore<any>, 'removePrevented'>
  >((event) => {
    if (preventRemove) {
      callback({ data: event.data });
    }
  });

  React.useEffect(
    () => navigation.addListener('removePrevented', removePreventedListener),
    [navigation, removePreventedListener]
  );
}
