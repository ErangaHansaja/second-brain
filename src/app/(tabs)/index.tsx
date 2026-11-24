import { useLocalSearchParams } from 'expo-router';
import ExplorerScreen from '@/screens/explorer/ExplorerScreen';

export default function ExplorerRoute() {
  const { nodeId } = useLocalSearchParams<{ nodeId?: string }>();
  return <ExplorerScreen initialNodeId={nodeId} />;
}
