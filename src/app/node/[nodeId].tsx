import { useLocalSearchParams } from 'expo-router';
import NodeDetailScreen from '@/screens/node-detail/NodeDetailScreen';

export default function NodeDetailRoute() {
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  return <NodeDetailScreen nodeId={nodeId ?? ''} />;
}
