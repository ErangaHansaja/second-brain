import { StyleSheet, Text, View } from 'react-native';

export default function ExplorerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Explorer</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#E8EAFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
