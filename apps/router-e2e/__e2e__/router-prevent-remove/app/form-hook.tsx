import { router, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useEffect, useRef, useState } from 'react';
import { Button, Text, View } from 'react-native';

export default function HookForm() {
  const navigation = useNavigation();
  const [dirty, setDirty] = useState(true);
  const [discardReady, setDiscardReady] = useState(false);
  const [preventedCount, setPreventedCount] = useState(0);
  const pendingAction = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);

  usePreventRemove(dirty, ({ data }) => {
    pendingAction.current = data.action;
    setPreventedCount((count) => count + 1);
  });

  useEffect(() => {
    if (!dirty) {
      setDiscardReady(true);
    }
  }, [dirty]);

  useEffect(() => {
    if (discardReady && pendingAction.current) {
      navigation.dispatch(pendingAction.current);
    }
  }, [discardReady, navigation]);

  return (
    <View>
      <Text testID="form-hook">Hook form</Text>
      <Text testID="dirty">{dirty ? 'dirty' : 'clean'}</Text>
      <Text testID="prevented-count">{preventedCount}</Text>
      <Button testID="back" title="Back" onPress={() => router.back()} />
      <Button testID="discard" title="Discard" onPress={() => setDirty(false)} />
    </View>
  );
}
