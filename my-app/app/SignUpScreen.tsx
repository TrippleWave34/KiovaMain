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

const FIREBASE_API_KEY = 'AIzaSyBZ_WLPCklEj7wWlyUjOFjJqChU6OglTpE';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            password: password,
            returnSecureToken: true,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        const code = data.error.message;
        if (code === 'EMAIL_EXISTS') {
          setError('An account with this email already exists');
        } else if (code === 'INVALID_EMAIL') {
          setError('Invalid email address');
        } else if (code === 'WEAK_PASSWORD : Password should be at least 6 characters') {
          setError('Password must be at least 6 characters');
        } else if (code === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
          setError('Too many attempts. Try again later');
        } else {
          setError('Something went wrong. Please try again');
        }
        return;
      }

      // Sign up successful — data.idToken and data.localId available here
      router.replace('/(tabs)/HomeScreen');

    } catch (err) {
      setError('Network error. Check your connection');
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
            <Text style={styles.badgeText}>✦ Get started</Text>
          </View>
          <Text style={styles.title}>Create your{'\n'}Account</Text>
          <Text style={styles.subtitle}>Join Kiova and start styling</Text>
        </View>

        <View style={styles.form}>
          {/* Email */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#AAAAAA"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#AAAAAA"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={[styles.inputWrapper, confirmPassword && password !== confirmPassword && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#AAAAAA"
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={18} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorWrapper}>
              <Ionicons name="alert-circle-outline" size={14} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Create Account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/LoginScreen')}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F3F0' },
  blobTopRight: { position: 'absolute', top: -60, right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: '#F4C4C4', opacity: 0.35 },
  blobBottomLeft: { position: 'absolute', bottom: 60, left: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: '#D4C8F0', opacity: 0.35 },
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  header: { marginBottom: 40 },
  badge: { backgroundColor: '#F0EDFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 16 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#6B4EFF', letterSpacing: 1 },
  title: { fontSize: 36, fontWeight: '800', color: '#1A1A1A', lineHeight: 44, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888' },
  form: { gap: 14 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 10, borderWidth: 1.5, borderColor: 'transparent' },
  inputError: { borderColor: '#FF3B30' },
  inputIcon: { marginRight: 4 },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  errorWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { color: '#FF3B30', fontSize: 13, fontWeight: '600' },
  button: { backgroundColor: '#1A1A1A', borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  loginText: { fontSize: 14, color: '#555', textAlign: 'center', marginTop: 4 },
  loginLink: { color: '#FF5722', fontWeight: '700' },
});