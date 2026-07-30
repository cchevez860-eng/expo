'use client';
import { nanoid } from 'nanoid/non-secure';
import * as React from 'react';
import { use } from 'react';

import { isRoutePreloadedInStack } from '../../utils/stack';
import useLatestCallback from '../../utils/useLatestCallback';
import type { NavigationState } from '../routers';
import { NavigationRouteContext } from './NavigationProvider';
import { type PreventedRoutes, PreventRemoveContext } from './PreventRemoveContext';
import { getPreventableRoutes } from './useOnPreventRemove';

type Props = {
  children: React.ReactNode;
  state: NavigationState;
  descriptors: Record<string, { options: { preventRemove?: boolean } }>;
};

type PreventedRouteEntry = {
  routeKey: string;
  preventRemove: boolean;
};

const transformPreventedRoutes = (entries: PreventedRouteEntry[]): PreventedRoutes =>
  entries.reduce<PreventedRoutes>((result, { routeKey, preventRemove }) => {
    result[routeKey] = {
      preventRemove: result[routeKey]?.preventRemove || preventRemove,
    };
    return result;
  }, {});

/**
 * Component used for exposing removal prevention state to navigator views.
 */
export function PreventRemoveProvider({ children, state, descriptors }: Props) {
  'use no memo';
  const [parentId] = React.useState(() => nanoid());
  const [childEntries, setChildEntries] = React.useState<Map<string, PreventedRouteEntry>>(
    () => new Map()
  );

  const route = use(NavigationRouteContext);
  const parentContext = use(PreventRemoveContext);
  const setParentPrevented = parentContext?.setPreventRemove;

  const setPreventRemove = useLatestCallback(
    (id: string, routeKey: string, preventRemove: boolean): void => {
      setChildEntries((previous) => {
        const existing = previous.get(id);
        if (existing?.routeKey === routeKey && existing.preventRemove === preventRemove) {
          return previous;
        }

        const next = new Map(previous);
        if (preventRemove) {
          next.set(id, { routeKey, preventRemove: true });
        } else {
          next.delete(id);
        }
        return next;
      });
    }
  );

  const entries = React.useMemo(() => {
    const ownEntries = getPreventableRoutes(state).flatMap<PreventedRouteEntry>((candidate) => {
      if (
        candidate.key === undefined ||
        isRoutePreloadedInStack(state, { key: candidate.key }) ||
        !descriptors[candidate.key]?.options.preventRemove
      ) {
        return [];
      }

      return [{ routeKey: candidate.key, preventRemove: true }];
    });
    const activeChildEntries = [...childEntries.values()].filter(
      ({ routeKey }) => !isRoutePreloadedInStack(state, { key: routeKey })
    );

    return [...ownEntries, ...activeChildEntries];
  }, [childEntries, descriptors, state]);
  const isPrevented = entries.some(({ preventRemove }) => preventRemove);

  React.useEffect(() => {
    if (route?.key !== undefined && setParentPrevented !== undefined) {
      setParentPrevented(parentId, route.key, isPrevented);
      return () => setParentPrevented(parentId, route.key, false);
    }

    return undefined;
  }, [parentId, isPrevented, route?.key, setParentPrevented]);

  const value = React.useMemo(
    () => ({
      setPreventRemove,
      preventedRoutes: transformPreventedRoutes(entries),
    }),
    [entries, setPreventRemove]
  );

  return <PreventRemoveContext.Provider value={value}>{children}</PreventRemoveContext.Provider>;
}
