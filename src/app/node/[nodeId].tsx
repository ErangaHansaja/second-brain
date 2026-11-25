import { useLocalSearchParams } from 'expo-router';
import NodeDetailScreen from '@/screens/node-detail/NodeDetailScreen';

export default function NodeDetailRoute() {
  const { nodeId, edit } = useLocalSearchParams<{ nodeId: string; edit?: string }>();
  return <NodeDetailScreen nodeId={nodeId ?? ''} initialEdit={edit === '1'} />;
}
