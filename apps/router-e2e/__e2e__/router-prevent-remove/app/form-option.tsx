import { router, Stack, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';

export default function OptionForm() {
  const navigation = useNavigation();
  const [preventedCount, setPreventedCount] = useState(0);

  useEffect(
    () =>
      navigation.addListener('removePrevented', () => {
        setPreventedCount((count) => count + 1);
      }),
    [navigation]
  );

  return (
    <View>
      <Stack.Screen options={{ preventRemove: true }} />
      <Text testID="form-option">Option form</Text>
      <Text testID="prevented-count">{preventedCount}</Text>
      <Button testID="back" title="Back" onPress={() => router.back()} />
    </View>
  );
}
