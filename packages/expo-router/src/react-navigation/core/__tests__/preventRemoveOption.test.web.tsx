/** @jest-environment jsdom */
import { act, render, screen } from '@testing-library/react';
import * as React from 'react';
import { View } from 'react-native';

import { ExpoRoot } from '../../../ExpoRoot';
import { store } from '../../../global-state/router-store';
import { router } from '../../../imperative-api';
import Stack from '../../../layouts/StackClient';
import { getMockContext } from '../../../testing-library/mock-config';
import { useNavigation } from '../useNavigation';

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as typeof ResizeObserver;

test('blocks back and emits removePrevented on web', () => {
  const removePrevented = jest.fn();
  const Form = () => {
    const navigation = useNavigation();
    React.useEffect(() => navigation.addListener('removePrevented', removePrevented), [navigation]);
    return <View testID="form" />;
  };

  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  const context = getMockContext({
    _layout: () => (
      <Stack>
        <Stack.Screen name="form" options={{ preventRemove: true }} />
      </Stack>
    ),
    index: () => <View testID="index" />,
    form: Form,
  });
  render(<ExpoRoot context={context} location="/" />);

  act(() => router.push('/form'));
  act(() => router.back());

  expect(screen.getByTestId('form')).toBeTruthy();
  expect(store.getRouteInfo().pathname).toBe('/form');
  expect(removePrevented).toHaveBeenCalledTimes(1);
  expect(removePrevented.mock.calls[0][0].data.action.type).toBe('GO_BACK');
});
