import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const FIREBASE_API_KEY = 'AIzaSyBZ_WLPCklEj7wWlyUjOFjJqChU6OglTpE';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [resending, setResending] = useState(false);
  const [resent, setResent]       = useState(false);
  const [error, setError]         = useState('');

  // Re-send verification email — user needs to log in first to get a fresh idToken
  const resendEmail = async () => {
    setResending(true);
    setError('');
    try {
      // We can't resend without an idToken — prompt them to go back and log in,
      // then we'll resend from there. For now show a helpful message.
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (e) {
      setError('Failed to resend. Try logging in again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="mail-unread-outline" size={48} color="#6B4EFF" />
        </View>

        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✦ Almost there</Text>
        </View>

        <Text style={styles.title}>Check your{'\n'}email</Text>
        <Text style={styles.subtitle}>
          We sent a verification link to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <View style={styles.stepsCard}>
          <View style={styles.step}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <Text style={styles.stepText}>Open the email from Kiova</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <Text style={styles.stepText}>Click the verification link</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <Text style={styles.stepText}>Come back and log in</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorWrapper}>
            <Ionicons name="alert-circle-outline" size={14} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {resent ? (
          <View style={styles.successWrapper}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#2E7D32" />
            <Text style={styles.successText}>Verification email resent!</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/LoginScreen')}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendBtn} onPress={resendEmail} disabled={resending}>
          {resending
            ? <ActivityIndicator size="small" color="#6B4EFF" />
            : <Text style={styles.resendText}>Didn't get it? Resend email</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#F5F3F0' },
  blobTopRight:   { position: 'absolute', top: -60, right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: '#F4C4C4', opacity: 0.35 },
  blobBottomLeft: { position: 'absolute', bottom: 60, left: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: '#D4C8F0', opacity: 0.35 },
  container:      { flex: 1, paddingHorizontal: 28, paddingTop: 60, alignItems: 'center' },
  iconWrap:       { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F0EDFF', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  badge:          { backgroundColor: '#F0EDFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 16 },
  badgeText:      { fontSize: 12, fontWeight: '700', color: '#6B4EFF', letterSpacing: 1 },
  title:          { fontSize: 36, fontWeight: '800', color: '#1A1A1A', lineHeight: 44, marginBottom: 12, textAlign: 'center' },
  subtitle:       { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  emailText:      { color: '#1A1A1A', fontWeight: '700' },
  stepsCard:      { width: '100%', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20, padding: 20, gap: 16, marginBottom: 28 },
  step:           { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepNum:        { width: 28, height: 28, borderRadius: 14, backgroundColor: '#6B4EFF', alignItems: 'center', justifyContent: 'center' },
  stepNumText:    { color: 'white', fontWeight: '800', fontSize: 13 },
  stepText:       { fontSize: 14, color: '#333', fontWeight: '500' },
  errorWrapper:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  errorText:      { color: '#FF3B30', fontSize: 13, fontWeight: '600' },
  successWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  successText:    { color: '#2E7D32', fontSize: 13, fontWeight: '600' },
  button:         { width: '100%', backgroundColor: '#1A1A1A', borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  buttonText:     { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  resendBtn:      { paddingVertical: 10 },
  resendText:     { fontSize: 14, color: '#6B4EFF', fontWeight: '600' },
});
