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
import { useAuth } from '../AuthContext';

const FIREBASE_API_KEY = 'AIzaSyBZ_WLPCklEj7wWlyUjOFjJqChU6OglTpE';

export default function LoginScreen() {
  const { setUser } = useAuth();
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [unverified, setUnverified]   = useState(false);
  const [resending, setResending]     = useState(false);
  const [resentOk, setResentOk]       = useState(false);

  // Stored after successful login but before verification check
  const [pendingToken, setPendingToken] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setUnverified(false);
    setLoading(true);

    try {
      // 1. Sign in
      const res  = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );
      const data = await res.json();

      if (data.error) {
        const code = data.error.message;
        if (code === 'EMAIL_NOT_FOUND' || code === 'INVALID_PASSWORD' || code === 'INVALID_LOGIN_CREDENTIALS') {
          setError('Incorrect email or password');
        } else if (code === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
          setError('Too many attempts. Try again later');
        } else if (code === 'USER_DISABLED') {
          setError('This account has been disabled');
        } else {
          setError('Something went wrong. Please try again');
        }
        return;
      }

      const idToken = data.idToken;

      // 2. Check if email is verified
      const lookupRes  = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );
      const lookupData = await lookupRes.json();
      const userInfo   = lookupData?.users?.[0];

      if (!userInfo?.emailVerified) {
        // Block login — show resend option
        setPendingToken(idToken);
        setUnverified(true);
        return;
      }

      // 3. Verified — store user and let them in
      setUser({
        uid: userInfo.localId,
        email: userInfo.email,
        displayName: userInfo.displayName ?? null,
        idToken,
      });
      router.replace('/(tabs)/HomeScreen');

    } catch (err) {
      setError('Network error. Check your connection');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!pendingToken) return;
    setResending(true);
    setResentOk(false);
    try {
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestType: 'VERIFY_EMAIL', idToken: pendingToken }),
        }
      );
      setResentOk(true);
      setTimeout(() => setResentOk(false), 4000);
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
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

          {/* Standard error */}
          {error ? (
            <View style={styles.errorWrapper}>
              <Ionicons name="alert-circle-outline" size={14} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Unverified email banner */}
          {unverified && (
            <View style={styles.unverifiedCard}>
              <Ionicons name="mail-unread-outline" size={20} color="#E65100" />
              <View style={{ flex: 1 }}>
                <Text style={styles.unverifiedTitle}>Email not verified</Text>
                <Text style={styles.unverifiedSub}>Check your inbox and click the link before logging in.</Text>
              </View>
              <TouchableOpacity onPress={resendVerification} disabled={resending}>
                {resending
                  ? <ActivityIndicator size="small" color="#E65100" />
                  : <Text style={styles.resendText}>Resend</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {resentOk && (
            <View style={styles.successWrapper}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#2E7D32" />
              <Text style={styles.successText}>Verification email sent!</Text>
            </View>
          )}

          <TouchableOpacity style={styles.forgotWrapper}>
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
              Don't have an account? <Text style={styles.signupLink}>Sign up</Text>
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
  resendText:       { fontSize: 13, fontWeight: '700', color: '#E65100' },
  successWrapper:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  successText:      { color: '#2E7D32', fontSize: 13, fontWeight: '600' },
  forgotWrapper:    { alignSelf: 'flex-end' },
  forgotText:       { fontSize: 13, color: '#6B4EFF', fontWeight: '600' },
  button:           { backgroundColor: '#1A1A1A', borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonText:       { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  signupText:       { fontSize: 14, color: '#555', textAlign: 'center', marginTop: 4 },
  signupLink:       { color: '#FF5722', fontWeight: '700' },
});
