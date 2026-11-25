import { Redirect } from 'expo-router';
import ComponentGalleryScreen from '@/screens/dev/ComponentGalleryScreen';

export default function DevGalleryRoute() {
  if (!__DEV__) return <Redirect href="/(tabs)" />;
  return <ComponentGalleryScreen />;
}
