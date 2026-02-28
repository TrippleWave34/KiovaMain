import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';

const { height } = Dimensions.get('window');

export default function WelcomePage() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Image collage — top half */}
      <View style={styles.imageContainer}>

        {/* Left tall image — centered crop */}
        <View style={styles.leftImageWrapper}>
          <Image
            source={require('../assets/images/FormalImage.jpg')}
            style={styles.leftImage}
            resizeMode="cover"
          />
        </View>

        {/* Right two stacked images */}
        <View style={styles.rightColumn}>
          <Image
            source={require('../assets/images/minimalistImage.jpg')}
            style={styles.rightTopImage}
            resizeMode="cover"
          />
          <Image
            source={require('../assets/images/streetwearImage.jpg')}
            style={styles.rightBottomImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Bottom content */}
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✦ AI Powered</Text>
        </View>

        <Text style={styles.title}>Mix, Match &{'\n'}Style Like a Pro</Text>
        <Text style={styles.subtitle}>
          Build outfits from your wardrobe and preview them with AI — all in one place.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)/HomeScreen')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/LoginScreen')}>
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    flexDirection: 'row',
    height: height * 0.52,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },

  // Left image centered — floats between the two right images
  leftImageWrapper: {
    flex: 1.5,
    borderRadius: 24,
    overflow: 'hidden',
    marginVertical: 30,
  },
  leftImage: {
    width: '100%',
    height: '100%',
  },

  // Right column
  rightColumn: {
    flex: 1,
    gap: 10,
  },
  rightTopImage: {
    flex: 1,
    borderRadius: 24,
  },
  rightBottomImage: {
    flex: 1,
    borderRadius: 24,
  },

  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 16,
  },
  badge: {
    backgroundColor: '#F0EDFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B4EFF',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1A1A1A',
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
    maxWidth: 280,
  },
  button: {
    backgroundColor: '#1A1A1A',
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 60,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  loginText: {
    fontSize: 14,
    color: '#555',
  },
  loginLink: {
    color: '#FF5722',
    fontWeight: '700',
  },
});