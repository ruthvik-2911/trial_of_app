import { View, Text, StyleSheet } from 'react-native';
import { C } from '../../constants/colors';

export default function ReviewModal() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ReviewModal Component</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: C.accent,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
