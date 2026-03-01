import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";

const WEEKLY_FREE_TOKENS = 5;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

// ⚠️ CHANGE THIS IF NEEDED:
// - Android emulator: "http://10.0.2.2:8000"
// - iOS simulator: usually "http://127.0.0.1:8000"
// - Real phone (Expo Go): "http://YOUR_PC_IP:8000" (ex: http://192.168.1.20:8000)
const API_URL = "http://10.1.24.78:8000";

export default function TokenModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [tokens, setTokens] = useState(5);
  const [nextReset, setNextReset] = useState("");

  useEffect(() => {
    // Calculate next Monday reset
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
    nextMonday.setHours(0, 0, 0, 0);

    const diff = nextMonday.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    setNextReset(`${days}d ${hours}h`);
  }, [visible]);

  // ✅ Stripe version: calls backend and opens Stripe Checkout URL
  const handleTopUp = async (plan: "basic" | "pro") => {
    const pretty = plan === "basic" ? "5 tokens for £1.99" : "10 tokens for £2.99";

    Alert.alert("Top Up Tokens", `Purchase ${pretty}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Buy",
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/payments/create-checkout-session-plan`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan }),
            });

            const data = await res.json();
            if (!res.ok) {
              throw new Error(data?.detail || "Failed to create checkout session");
            }

            // Open Stripe Checkout
            await WebBrowser.openBrowserAsync(data.url);

            // ✅ OPTIONAL (demo-only): instantly add tokens after checkout opens
            // In a real app, you should add tokens ONLY after webhook confirms payment.
            // setTokens((prev) => prev + (plan === "basic" ? 5 : 10));
          } catch (e: any) {
            Alert.alert("Payment error", e.message);
          }
        },
      },
    ]);
  };

  const tokenPercentage = Math.min((tokens / WEEKLY_FREE_TOKENS) * 100, 100);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
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
              <Text style={styles.tokenCount}>{tokens}</Text>
              <Text style={styles.tokenMax}>/ {WEEKLY_FREE_TOKENS} free</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${tokenPercentage}%` as any,
                    backgroundColor: tokens === 0 ? "#E05555" : tokens <= 2 ? "#F4A261" : "#6B4EFF",
                  },
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
          >
            <View style={styles.topUpLeft}>
              <View style={[styles.topUpIconWrap, { backgroundColor: "#6B4EFF20" }]}>
                <Feather name="zap" size={16} color="#6B4EFF" />
              </View>
              <View>
                <Text style={styles.topUpLabel}>10 Tokens</Text>
                <Text style={[styles.topUpSub, { color: "#6B4EFF" }]}>
                  Best value 🔥
                </Text>
              </View>
            </View>
            <View style={[styles.topUpPriceWrap, { backgroundColor: "#6B4EFF" }]}>
              <Text style={[styles.topUpPrice, { color: "white" }]}>£2.99</Text>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    paddingTop: 70,
    paddingHorizontal: 16,
  },

  sheet: {
    backgroundColor: "#FAFAFA",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },

  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F0EFED",
    justifyContent: "center",
    alignItems: "center",
  },

  headerText: {
    flex: 1,
  },

  username: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  email: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },

  editAccount: {
    fontSize: 13,
    color: "#F4A261",
    fontWeight: "600",
    marginTop: 4,
  },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0EFED",
    justifyContent: "center",
    alignItems: "center",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 16,
  },

  tokenSection: {
    alignItems: "center",
    paddingVertical: 4,
  },

  tokenLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#aaa",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  tokenCountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginTop: 8,
    marginBottom: 14,
  },

  tokenCount: {
    fontSize: 52,
    fontWeight: "800",
    color: "#1a1a1a",
    lineHeight: 56,
  },

  tokenMax: {
    fontSize: 14,
    color: "#aaa",
    fontWeight: "600",
    marginBottom: 10,
  },

  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#EBEBEB",
    borderRadius: 4,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 4,
  },

  resetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },

  resetText: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "500",
  },

  topUpTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
  },

  topUpOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F3F0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },

  topUpOptionHighlight: {
    backgroundColor: "#F0EEFF",
    borderWidth: 1.5,
    borderColor: "#6B4EFF30",
  },

  topUpLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  topUpIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  topUpLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  topUpSub: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },

  topUpPriceWrap: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  topUpPrice: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});