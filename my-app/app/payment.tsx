import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { auth } from "./firebase";

function crossAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function crossConfirm(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Buy", onPress: onConfirm },
    ]);
  }
}

const WEEKLY_FREE_TOKENS = 5;
const API_URL = "http://127.0.0.1:8001";

async function getToken(): Promise<string> {
  // TEMP: bypass auth for testing
  return "test-token";
  // TODO: restore when auth is connected:
  // const user = auth.currentUser;
  // if (!user) throw new Error("Not logged in");
  // return await user.getIdToken();
}

async function getUid(): Promise<string> {
  // TEMP
  return "test-user-123";
  // TODO: return auth.currentUser?.uid ?? "";
}

export default function TokenModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [tokens, setTokens]       = useState<number | null>(null);
  const [nextReset, setNextReset] = useState("...");
  const [loading, setLoading]     = useState(false);

  const fetchBalance = async () => {
    try {
      const token = await getToken();
      const res   = await fetch(`${API_URL}/tokens`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setTokens(data.tokens);
      setNextReset(data.next_reset);
    } catch (e) {
      console.error("Failed to fetch token balance:", e);
    }
  };

  // Refresh balance every time the modal opens
  useEffect(() => {
    if (visible) fetchBalance();
  }, [visible]);

  const handleTopUp = async (plan: "basic" | "pro") => {
    const pretty = plan === "basic" ? "5 tokens for £1.99" : "10 tokens for £2.99";

    crossConfirm("Top Up Tokens", `Purchase ${pretty}?`, async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const uid   = await getUid();

        const res = await fetch(`${API_URL}/payments/create-checkout-session-plan`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan, uid }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail || "Failed to create checkout session");

        // Open Stripe Checkout in browser
        if (Platform.OS === "web") {
          window.open(data.url, "_blank");
        } else {
          await WebBrowser.openBrowserAsync(data.url);
        }

        // Poll for balance update after user returns (webhook may take a moment)
        setTimeout(fetchBalance, 3000);
        setTimeout(fetchBalance, 6000);
      } catch (e: any) {
        crossAlert("Payment error", e.message);
      } finally {
        setLoading(false);
      }
    });
  };

  const displayTokens  = tokens ?? 0;
  const tokenPct       = Math.min((displayTokens / WEEKLY_FREE_TOKENS) * 100, 100);
  const progressColour = displayTokens === 0 ? "#E05555" : displayTokens <= 2 ? "#F4A261" : "#6B4EFF";

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person-outline" size={22} color="#555" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.username}>Username</Text>
              <Text style={styles.email}>email@example.com</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={18} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Token Display */}
          <View style={styles.tokenSection}>
            <Text style={styles.tokenLabel}>WEEKLY TOKENS</Text>

            <View style={styles.tokenCountRow}>
              {tokens === null ? (
                <ActivityIndicator size="small" color="#6B4EFF" style={{ marginVertical: 12 }} />
              ) : (
                <>
                  <Text style={styles.tokenCount}>{displayTokens}</Text>
                  <Text style={styles.tokenMax}>/ {WEEKLY_FREE_TOKENS} free</Text>
                </>
              )}
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${tokenPct}%` as any, backgroundColor: progressColour },
                ]}
              />
            </View>

            <View style={styles.resetRow}>
              <Feather name="refresh-cw" size={11} color="#aaa" />
              <Text style={styles.resetText}>Resets in {nextReset}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Top Up Options */}
          <Text style={styles.topUpTitle}>Top Up</Text>

          <TouchableOpacity
            style={styles.topUpOption}
            onPress={() => handleTopUp("basic")}
            disabled={loading}
          >
            <View style={styles.topUpLeft}>
              <View style={[styles.topUpIconWrap, { backgroundColor: "#F4A26120" }]}>
                <Feather name="zap" size={16} color="#F4A261" />
              </View>
              <View>
                <Text style={styles.topUpLabel}>5 Tokens</Text>
                <Text style={styles.topUpSub}>Good for a few outfits</Text>
              </View>
            </View>
            <View style={styles.topUpPriceWrap}>
              <Text style={styles.topUpPrice}>£1.99</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.topUpOption, styles.topUpOptionHighlight]}
            onPress={() => handleTopUp("pro")}
            disabled={loading}
          >
            <View style={styles.topUpLeft}>
              <View style={[styles.topUpIconWrap, { backgroundColor: "#6B4EFF20" }]}>
                <Feather name="zap" size={16} color="#6B4EFF" />
              </View>
              <View>
                <Text style={styles.topUpLabel}>10 Tokens</Text>
                <Text style={[styles.topUpSub, { color: "#6B4EFF" }]}>Best value 🔥</Text>
              </View>
            </View>
            <View style={[styles.topUpPriceWrap, { backgroundColor: "#6B4EFF" }]}>
              {loading
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={[styles.topUpPrice, { color: "white" }]}>£2.99</Text>
              }
            </View>
          </TouchableOpacity>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start", paddingTop: 70, paddingHorizontal: 16,
  },
  sheet: {
    backgroundColor: "#FAFAFA", borderRadius: 24, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  header:      { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  avatarCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#F0EFED", justifyContent: "center", alignItems: "center" },
  headerText:  { flex: 1 },
  username:    { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  email:       { fontSize: 13, color: "#999", marginTop: 2 },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F0EFED", justifyContent: "center", alignItems: "center" },
  divider:     { height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginVertical: 16 },
  tokenSection: { alignItems: "center", paddingVertical: 4 },
  tokenLabel:  { fontSize: 11, fontWeight: "700", color: "#aaa", letterSpacing: 1.2, textTransform: "uppercase" },
  tokenCountRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginTop: 8, marginBottom: 14 },
  tokenCount:  { fontSize: 52, fontWeight: "800", color: "#1a1a1a", lineHeight: 56 },
  tokenMax:    { fontSize: 14, color: "#aaa", fontWeight: "600", marginBottom: 10 },
  progressBar: { width: "100%", height: 8, backgroundColor: "#EBEBEB", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  resetRow:    { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  resetText:   { fontSize: 12, color: "#aaa", fontWeight: "500" },
  topUpTitle:  { fontSize: 16, fontWeight: "800", color: "#1a1a1a", marginBottom: 12 },
  topUpOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F5F3F0", borderRadius: 16, padding: 14, marginBottom: 10 },
  topUpOptionHighlight: { backgroundColor: "#F0EEFF", borderWidth: 1.5, borderColor: "#6B4EFF30" },
  topUpLeft:   { flexDirection: "row", alignItems: "center", gap: 12 },
  topUpIconWrap: { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  topUpLabel:  { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  topUpSub:    { fontSize: 12, color: "#999", marginTop: 2 },
  topUpPriceWrap: { backgroundColor: "#1a1a1a", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  topUpPrice:  { color: "white", fontWeight: "700", fontSize: 14 },
});
