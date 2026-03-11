import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Image,
  Platform,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from 'expo-router';
import TokenModal from '../payment';
import { useAuth } from '../AuthContext';

const FIREBASE_API_KEY = 'AIzaSyBZ_WLPCklEj7wWlyUjOFjJqChU6OglTpE';

export default function SettingsScreen() {
  const { user, setUser, getToken } = useAuth();

  const [showAccount, setShowAccount]         = useState(false);
  const [showAbout, setShowAbout]             = useState(false);
  const [showTerms, setShowTerms]             = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword]         = useState("");
  const [passwordError, setPasswordError]     = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showTokens, setShowTokens]           = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const email       = user?.email || 'Not signed in';

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setPasswordError('');
    try {
      const token = await getToken();
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: token, password: newPassword, returnSecureToken: true }),
        }
      );
      const data = await res.json();
      if (data.error) {
        setPasswordError('Failed to update password. Please try again.');
        return;
      }
      setPasswordSuccess(true);
      setChangingPassword(false);
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (e) {
      setPasswordError('Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    router.replace('/WelcomePage');
  };

  const RowItem = ({ icon, label, sublabel, onPress, iconColor = "#F4A261" }: any) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, { backgroundColor: iconColor + "20" }]}>
          <Feather name={icon} size={18} color={iconColor} />
        </View>
        <View>
          <Text style={styles.rowLabel}>{label}</Text>
          {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
        </View>
      </View>
      <Feather name="chevron-right" size={18} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => setShowTokens(true)}>
          <Ionicons name="person-outline" size={20} color="#555" />
        </TouchableOpacity>
        <View style={styles.logoWrapper}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
        <TouchableOpacity style={styles.iconCircle}>
          <Ionicons name="notifications-outline" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        {/* User info card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{displayName[0].toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{email}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <RowItem icon="user" label="Account" sublabel="Email & password" onPress={() => setShowAccount(true)} />
          <View style={styles.divider} />
          <RowItem icon="info" label="About Us" sublabel="What is Kiova?" onPress={() => setShowAbout(true)} iconColor="#6B4EFF" />
          <View style={styles.divider} />
          <RowItem icon="file-text" label="Terms & Conditions" sublabel="Last updated: 09/01/2026" onPress={() => setShowTerms(true)} iconColor="#555" />
        </View>

        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: "#F4A26120" }]}>
                <Feather name="mail" size={18} color="#F4A261" />
              </View>
              <View>
                <Text style={styles.rowLabel}>Contact Us</Text>
                <Text style={styles.rowSublabel}>kiova.app@gmail.com</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={18} color="white" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Account Modal */}
      <Modal visible={showAccount} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Account</Text>

            <View style={styles.infoRow}>
              <Feather name="mail" size={16} color="#888" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Feather name="user" size={16} color="#888" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>{displayName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Feather name="lock" size={16} color="#888" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.infoLabel}>Password</Text>
                {changingPassword ? (
                  <View style={styles.passwordInputRow}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter new password"
                      secureTextEntry
                      value={newPassword}
                      onChangeText={(t) => { setNewPassword(t); setPasswordError(''); }}
                      placeholderTextColor="#bbb"
                    />
                    <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
                      <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.infoValue}>••••••••</Text>
                )}
              </View>
            </View>

            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            {passwordSuccess ? (
              <Text style={styles.successText}>Password updated successfully!</Text>
            ) : null}

            {!changingPassword && (
              <TouchableOpacity style={styles.changePasswordBtn} onPress={() => setChangingPassword(true)}>
                <Text style={styles.changePasswordText}>Change Password</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => { setShowAccount(false); setChangingPassword(false); setNewPassword(''); setPasswordError(''); }}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* About Us Modal */}
      <Modal visible={showAbout} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.aboutLogoRow}>
              <Image source={require('../../assets/images/logo.png')} style={styles.aboutLogoImage} resizeMode="contain" />
            </View>
            <Text style={styles.modalTitle}>About Us</Text>
            <Text style={styles.aboutBody}>Kiova is a visual, creative tool — a sandbox where users can combine:</Text>
            <View style={styles.aboutBullet}>
              <Feather name="check-circle" size={15} color="#F4A261" />
              <Text style={styles.aboutBulletText}>Clothes they already own</Text>
            </View>
            <View style={styles.aboutBullet}>
              <Feather name="check-circle" size={15} color="#F4A261" />
              <Text style={styles.aboutBulletText}>Clothes they want to buy online</Text>
            </View>
            <Text style={[styles.aboutBody, { marginTop: 16 }]}>
              The outcome of Kiova is a complete outfit visualisation. Users see "what goes together" before making a purchase or choosing their daily outfit.
            </Text>
            <View style={styles.launchBanner}>
              <Feather name="zap" size={15} color="#6B4EFF" />
              <Text style={styles.launchText}>We are planning to launch the app next week — we'd love you to try it out!</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAbout(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal visible={showTerms} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: "90%" }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <Text style={styles.termsDate}>Last updated: 09/01/2026</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Text style={styles.termsIntro}>
                Welcome to Kiova. By accessing or using the Kiova app and services, you agree to these Terms and Conditions.
              </Text>
              {[
                { title: "1. What Kiova Is", body: "Kiova is a fashion styling platform that helps users organise their wardrobe, upload clothing items, and generate outfit ideas using AI-assisted features." },
                { title: "2. Eligibility", body: "You must be at least 13 years old to use Kiova and provide accurate account information." },
                { title: "3. Your Account", body: "You are responsible for all activity under your account and keeping your login details secure." },
                { title: "4. User Content", body: "You may upload clothing images and confirm you own or have the right to use any content you upload." },
                { title: "5. Image Rules", body: "Images must be fashion-related and appropriate. No nudity, hate, violence, or extremist material." },
                { title: "6. AI Styling Features", body: "AI results are for inspiration only. You remain responsible for your styling and purchasing decisions." },
                { title: "7. Paid Features & Tokens", body: "Purchases are generally non-refundable unless required by law. Kiova may update pricing over time." },
                { title: "8. Content Ownership", body: "You keep ownership of your content but grant Kiova a licence to host and process it to operate the platform." },
                { title: "9. Prohibited Use", body: "You may not use Kiova for abusive purposes, upload illegal content, or attempt to bypass security." },
                { title: "10. Disclaimers", body: "Kiova is provided as is. We do not guarantee uninterrupted service or perfect AI results." },
                { title: "11. Governing Law", body: "These Terms are governed by the laws of England and Wales." },
              ].map((section) => (
                <View key={section.title} style={styles.termsSection}>
                  <Text style={styles.termsSectionTitle}>{section.title}</Text>
                  <Text style={styles.termsSectionBody}>{section.body}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowTerms(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TokenModal visible={showTokens} onClose={() => setShowTokens(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#F5F3F0" },
  blob1:            { position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: "#F4C4C4", opacity: 0.35 },
  blob2:            { position: "absolute", bottom: 100, left: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: "#D4C8F0", opacity: 0.35 },
  topBar:           { marginTop: 58, marginBottom: 8, paddingHorizontal: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconCircle:       { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.75)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.06)" },
  logoWrapper:      { flexDirection: "row", alignItems: "center" },
  logoImage:        { width: 120, height: 40 },
  scrollContent:    { paddingHorizontal: 22, paddingBottom: 110 },
  title:            { fontSize: 36, fontWeight: "800", color: "#1a1a1a", marginTop: 28, marginBottom: 20 },
  userCard:         { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 18, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  userAvatar:       { width: 48, height: 48, borderRadius: 24, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" },
  userAvatarText:   { color: "white", fontWeight: "800", fontSize: 18 },
  userName:         { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  userEmail:        { fontSize: 13, color: "#999", marginTop: 2 },
  sectionLabel:     { fontSize: 12, fontWeight: "700", color: "#aaa", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginLeft: 4 },
  card:             { backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 18, marginBottom: 24, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", overflow: "hidden" },
  row:              { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 16 },
  rowLeft:          { flexDirection: "row", alignItems: "center", gap: 14 },
  rowIcon:          { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  rowLabel:         { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  rowSublabel:      { fontSize: 13, color: "#999", marginTop: 2 },
  divider:          { height: 1, backgroundColor: "rgba(0,0,0,0.05)", marginHorizontal: 18 },
  logoutButton:     { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#E05555", paddingVertical: 16, borderRadius: 30, gap: 10, marginTop: 8 },
  logoutText:       { color: "white", fontWeight: "700", fontSize: 16 },
  modalOverlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalSheet:       { backgroundColor: "#FAFAFA", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, maxHeight: "80%" },
  modalHandle:      { width: 40, height: 4, backgroundColor: "#ddd", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle:       { fontSize: 24, fontWeight: "800", color: "#1a1a1a", marginBottom: 20 },
  infoRow:          { flexDirection: "row", alignItems: "flex-start", paddingVertical: 14 },
  infoLabel:        { fontSize: 12, color: "#aaa", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 },
  infoValue:        { fontSize: 15, color: "#1a1a1a", fontWeight: "600", marginTop: 3 },
  passwordInputRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  passwordInput:    { flex: 1, backgroundColor: "#F0EFED", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#1a1a1a" },
  saveBtn:          { backgroundColor: "#1a1a1a", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  saveBtnText:      { color: "white", fontWeight: "700", fontSize: 14 },
  errorText:        { color: "#FF3B30", fontSize: 13, fontWeight: "600", marginTop: 8 },
  successText:      { color: "#2E7D32", fontSize: 13, fontWeight: "600", marginTop: 8 },
  changePasswordBtn: { marginTop: 16, backgroundColor: "#F0EFED", paddingVertical: 13, borderRadius: 30, alignItems: "center" },
  changePasswordText: { fontWeight: "700", color: "#1a1a1a", fontSize: 14 },
  closeBtn:         { marginTop: 16, backgroundColor: "#1a1a1a", paddingVertical: 14, borderRadius: 30, alignItems: "center" },
  closeBtnText:     { color: "white", fontWeight: "700", fontSize: 15 },
  aboutLogoRow:     { alignItems: "center", marginBottom: 8 },
  aboutLogoImage:   { width: 100, height: 34 },
  aboutBody:        { fontSize: 14, color: "#555", lineHeight: 22 },
  aboutBullet:      { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  aboutBulletText:  { fontSize: 14, color: "#1a1a1a", fontWeight: "600" },
  launchBanner:     { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#F0EEFF", borderRadius: 14, padding: 14, marginTop: 20 },
  launchText:       { flex: 1, fontSize: 13, color: "#6B4EFF", fontWeight: "600", lineHeight: 20 },
  termsDate:        { fontSize: 12, color: "#aaa", marginTop: -14, marginBottom: 16 },
  termsIntro:       { fontSize: 13, color: "#666", lineHeight: 20, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#eee" },
  termsSection:     { marginBottom: 18 },
  termsSectionTitle: { fontSize: 14, fontWeight: "800", color: "#1a1a1a", marginBottom: 6 },
  termsSectionBody: { fontSize: 13, color: "#666", lineHeight: 21 },
});
