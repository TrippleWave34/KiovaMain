import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { firebaseAuth } from '../AuthContext';

export default function LoginScreen() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [unverified, setUnverified]     = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address first');
      return;
    }
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      alert('Password reset email sent! Check your inbox.');
    } catch {
      setError('Failed to send reset email. Try again.');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setUnverified(false);
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);

      if (!result.user.emailVerified) {
        await firebaseAuth.signOut();
        setUnverified(true);
        return;
      }

      router.replace('/(tabs)/HomeScreen');

    } catch (err: any) {
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect email or password');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later');
      } else if (code === 'auth/user-disabled') {
        setError('This account has been disabled');
      } else {
        setError('Something went wrong. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✦ Welcome back</Text>
          </View>
          <Text style={styles.title}>Login to{'\n'}Kiova</Text>
          <Text style={styles.subtitle}>Enter your credentials to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#AAAAAA"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); setUnverified(false); }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#AAAAAA"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); setUnverified(false); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#888" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorWrapper}>
              <Ionicons name="alert-circle-outline" size={14} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {unverified && (
            <View style={styles.unverifiedCard}>
              <Ionicons name="mail-unread-outline" size={20} color="#E65100" />
              <View style={{ flex: 1 }}>
                <Text style={styles.unverifiedTitle}>Email not verified</Text>
                <Text style={styles.unverifiedSub}>Check your inbox and click the link before logging in.</Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.forgotWrapper} onPress={handleForgotPassword}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Login</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/SignUpScreen')}>
            <Text style={styles.signupText}>
              Don&apos;t have an account? <Text style={styles.signupLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#F5F3F0' },
  blobTopRight:     { position: 'absolute', top: -60, right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: '#F4C4C4', opacity: 0.35 },
  blobBottomLeft:   { position: 'absolute', bottom: 60, left: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: '#D4C8F0', opacity: 0.35 },
  container:        { flex: 1, paddingHorizontal: 28, paddingTop: 16 },
  backBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  header:           { marginBottom: 40 },
  badge:            { backgroundColor: '#F0EDFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 16 },
  badgeText:        { fontSize: 12, fontWeight: '700', color: '#6B4EFF', letterSpacing: 1 },
  title:            { fontSize: 36, fontWeight: '800', color: '#1A1A1A', lineHeight: 44, marginBottom: 8 },
  subtitle:         { fontSize: 14, color: '#888' },
  form:             { gap: 14 },
  inputWrapper:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 10 },
  inputIcon:        { marginRight: 4 },
  input:            { flex: 1, fontSize: 15, color: '#1A1A1A' },
  errorWrapper:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText:        { color: '#FF3B30', fontSize: 13, fontWeight: '600' },
  unverifiedCard:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FFF3E0', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FFE0B2' },
  unverifiedTitle:  { fontSize: 13, fontWeight: '700', color: '#E65100', marginBottom: 2 },
  unverifiedSub:    { fontSize: 12, color: '#BF360C', lineHeight: 17 },
  forgotWrapper:    { alignSelf: 'flex-end' },
  forgotText:       { fontSize: 13, color: '#6B4EFF', fontWeight: '600' },
  button:           { backgroundColor: '#1A1A1A', borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonText:       { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  signupText:       { fontSize: 14, color: '#555', textAlign: 'center', marginTop: 4 },
  signupLink:       { color: '#FF5722', fontWeight: '700' },
});
