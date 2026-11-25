import { Stack } from 'expo-router';
import { Colors } from '@/theme/tokens';

export default function NodeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg.void },
      }}
    />
  );
}
