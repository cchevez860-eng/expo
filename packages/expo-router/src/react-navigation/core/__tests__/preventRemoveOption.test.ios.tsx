import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import { type ParamListBase, StackActions, StackRouter } from '../../routers';
import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';

jest.mock('nanoid/non-secure', () => {
  const m = { nanoid: () => String(++m.__key), __key: 0 };
  return m;
});

beforeEach(() => {
  require('nanoid/non-secure').__key = 0;
});

test('uses preventRemove option instead of beforeRemove to block removal', () => {
  const TestNavigator = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  const removePrevented = jest.fn();
  const beforeRemove = jest.fn();
  let screenNavigation: any;

  const TestScreen = ({ navigation }: any) => {
    screenNavigation = navigation;
    React.useEffect(() => navigation.addListener('removePrevented', removePrevented), [navigation]);
    React.useEffect(
      () =>
        navigation.addListener('beforeRemove', (event: any) => {
          beforeRemove(event);
          event.preventDefault();
        }),
      [navigation]
    );
    return null;
  };

  const ref = createNavigationContainerRef<ParamListBase>();
  render(
    <BaseNavigationContainer ref={ref}>
      <TestNavigator initialRouteName="foo">
        <Screen name="foo">{() => null}</Screen>
        <Screen name="bar" component={TestScreen} options={{ preventRemove: true }} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  act(() => ref.current?.navigate('bar'));
  const action = StackActions.pop();
  act(() => ref.current?.dispatch(action));

  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual(['foo', 'bar']);
  expect(removePrevented).toHaveBeenCalledTimes(1);
  expect(removePrevented.mock.calls[0][0].type).toBe('removePrevented');
  expect(removePrevented.mock.calls[0][0].data.action).toBe(action);
  expect(beforeRemove).not.toHaveBeenCalled();

  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  act(() => screenNavigation.setOptions({ preventRemove: false }));
  act(() => ref.current?.goBack());

  expect(ref.current?.getRootState().routes.map((route) => route.name)).toEqual(['foo']);
  expect(beforeRemove).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledWith("The event 'beforeRemove' is not preventable.");
  warn.mockRestore();
});
