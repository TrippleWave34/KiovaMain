mport React, { useState, useEffect } from "react";
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
import { useAuth } from "../app/AuthContext";

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
const MAX_TOKENS = 20;
const API_URL = "https://kiovamain.onrender.com";

export default function TokenModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { user, getToken } = useAuth();
  const [tokens, setTokens] = useState<number | null>(null);
  const [nextReset, setNextReset] = useState("...");
  const [loading, setLoading] = useState<"basic" | "pro" | null>(null);

  const fetchBalance = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/tokens`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setTokens(data.tokens);
      setNextReset(data.next_reset);
      return data.tokens;
    } catch (e) {
      console.error("Failed to fetch token balance:", e);
    }
  };

  useEffect(() => {
    if (visible) fetchBalance();
  }, [visible]);

  const handleTopUp = async (plan: "basic" | "pro") => {
    const pretty = plan === "basic" ? "5 tokens for £1.99" : "10 tokens for £2.99";
    const currentTokens = tokens ?? 0;

    if (currentTokens >= MAX_TOKENS) {
      if (Platform.OS === "web") {
        window.alert(`Token limit reached\n\nYou already have the maximum of ${MAX_TOKENS} tokens. Use some first!`);
      } else {
        Alert.alert("Token limit reached", `You already have the maximum of ${MAX_TOKENS} tokens. Use some first!`);
      }
      return;
    }

    crossConfirm("Top Up Tokens", `Purchase ${pretty}?`, async () => {
      setLoading(plan);
      try {
        const token = await getToken();
        const uid = user?.uid;
        if (!uid) throw new Error("Not logged in");

        const res = await fetch(`${API_URL}/payments/create-paypal-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan, uid }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail || "Failed to create PayPal order");

        // Open PayPal
        if (Platform.OS === "web") {
          window.open(data.approval_url, "_blank");
        } else {
          await WebBrowser.openBrowserAsync(data.approval_url);
        }

        // After returning from PayPal, refresh token balance
        await new Promise(resolve => setTimeout(resolve, 2000));
        await fetchBalance();

      } catch (e: any) {
        if (Platform.OS === "web") {
          window.alert(`Payment error\n\n${e.message}`);
        } else {
          Alert.alert("Payment error", e.message);
        }
      } finally {
        setLoading(null);
      }
    });
  };

  const totalTokens = tokens ?? 0;
  const freeTokens = Math.min(totalTokens, WEEKLY_FREE_TOKENS);
  const bonusTokens = Math.max(0, totalTokens - WEEKLY_FREE_TOKENS);
  const freeTokenPct = Math.min((totalTokens / MAX_TOKENS) * 100, 100);
  const progressColour = totalTokens === 0 ? "#E05555" : totalTokens <= 3 ? "#F4A261" : "#6B4EFF";
  const atMax = totalTokens >= MAX_TOKENS;

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
              <Text style={styles.username}>{user?.displayName || user?.email?.split("@")[0] || "User"}</Text>
              <Text style={styles.email}>{user?.email || "Not signed in"}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={18} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Token Display */}
          <View style={styles.tokenSection}>
            <Text style={styles.tokenLabel}>TOKENS</Text>

            <View style={styles.tokenCountRow}>
              {tokens === null ? (
                <ActivityIndicator size="small" color="#6B4EFF" style={{ marginVertical: 12 }} />
              ) : (
                <>
                  <Text style={styles.tokenCount}>{totalTokens}</Text>
                  <Text style={styles.tokenMax}>/ {MAX_TOKENS} max</Text>
                </>
              )}
            </View>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${freeTokenPct}%` as any, backgroundColor: progressColour }]} />
            </View>

            <View style={styles.resetRow}>
              <Feather name="refresh-cw" size={11} color="#aaa" />
              <Text style={styles.resetText}>Free tokens reset in {nextReset}</Text>
            </View>

            {bonusTokens > 0 && (
              <View style={styles.bonusRow}>
                <View style={styles.bonusBadge}>
                  <Feather name="zap" size={12} color="#6B4EFF" />
                  <Text style={styles.bonusText}>+{bonusTokens} purchased tokens</Text>
                </View>
              </View>
            )}

            {atMax && (
              <View style={styles.maxBadge}>
                <Text style={styles.maxText}>🎉 Maximum tokens reached!</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Top Up Options */}
          <Text style={styles.topUpTitle}>Top Up with PayPal</Text>

          <TouchableOpacity
            style={[styles.topUpOption, atMax && styles.disabledOption]}
            onPress={() => handleTopUp("basic")}
            disabled={loading !== null || atMax}
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
              {loading === "basic"
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={styles.topUpPrice}>£1.99</Text>
              }
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.topUpOption, styles.topUpOptionHighlight, atMax && styles.disabledOption]}
            onPress={() => handleTopUp("pro")}
            disabled={loading !== null || atMax}
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
              {loading === "pro"
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={[styles.topUpPrice, { color: "white" }]}>£2.99</Text>
              }
            </View>
          </TouchableOpacity>

          {/* PayPal badge */}
          <View style={styles.paypalBadge}>
            <Text style={styles.paypalText}>🔒 Secured by PayPal</Text>
          </View>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:              { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-start", paddingTop: 70, paddingHorizontal: 16 },
  sheet:                { backgroundColor: "#FAFAFA", borderRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
  header:               { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  avatarCircle:         { width: 46, height: 46, borderRadius: 23, backgroundColor: "#F0EFED", justifyContent: "center", alignItems: "center" },
  headerText:           { flex: 1 },
  username:             { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  email:                { fontSize: 13, color: "#999", marginTop: 2 },
  closeBtn:             { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F0EFED", justifyContent: "center", alignItems: "center" },
  divider:              { height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginVertical: 16 },
  tokenSection:         { alignItems: "center", paddingVertical: 4 },
  tokenLabel:           { fontSize: 11, fontWeight: "700", color: "#aaa", letterSpacing: 1.2, textTransform: "uppercase" },
  tokenCountRow:        { flexDirection: "row", alignItems: "flex-end", gap: 6, marginTop: 8, marginBottom: 14 },
  tokenCount:           { fontSize: 52, fontWeight: "800", color: "#1a1a1a", lineHeight: 56 },
  tokenMax:             { fontSize: 14, color: "#aaa", fontWeight: "600", marginBottom: 10 },
  progressBar:          { width: "100%", height: 8, backgroundColor: "#EBEBEB", borderRadius: 4, overflow: "hidden" },
  progressFill:         { height: "100%", borderRadius: 4 },
  resetRow:             { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  resetText:            { fontSize: 12, color: "#aaa", fontWeight: "500" },
  bonusRow:             { marginTop: 12 },
  bonusBadge:           { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F0EEFF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  bonusText:            { fontSize: 13, fontWeight: "700", color: "#6B4EFF" },
  maxBadge:             { marginTop: 12, backgroundColor: "#FFF7ED", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  maxText:              { fontSize: 13, fontWeight: "700", color: "#F4A261" },
  topUpTitle:           { fontSize: 16, fontWeight: "800", color: "#1a1a1a", marginBottom: 12 },
  topUpOption:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F5F3F0", borderRadius: 16, padding: 14, marginBottom: 10 },
  topUpOptionHighlight: { backgroundColor: "#F0EEFF", borderWidth: 1.5, borderColor: "#6B4EFF30" },
  disabledOption:       { opacity: 0.4 },
  topUpLeft:            { flexDirection: "row", alignItems: "center", gap: 12 },
  topUpIconWrap:        { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  topUpLabel:           { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  topUpSub:             { fontSize: 12, color: "#999", marginTop: 2 },
  topUpPriceWrap:       { backgroundColor: "#1a1a1a", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  topUpPrice:           { color: "white", fontWeight: "700", fontSize: 14 },
  paypalBadge:          { alignItems: "center", marginTop: 8 },
  paypalText:           { fontSize: 12, color: "#aaa", fontWeight: "600" },
});
