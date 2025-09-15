// App.js (ponto de entrada principal)
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Colors } from './constants/Colors';
import HomeScreen from './app/index';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <HomeScreen />
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});