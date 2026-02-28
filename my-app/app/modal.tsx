import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal</Text>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Go back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF9F5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B2315',
    marginBottom: 16,
  },
  link: {
    fontSize: 15,
    color: '#7A4A2E',
  },
});