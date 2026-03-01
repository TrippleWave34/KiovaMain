import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { id: "1", label: "All" },
  { id: "2", label: "Tops" },
  { id: "3", label: "Bottoms" },
  { id: "4", label: "Outerwear" },
  { id: "5", label: "Dresses" },
  { id: "6", label: "Activewear" },
  { id: "7", label: "Shoes" },
  { id: "8", label: "Accessories" },
];

type ClothingItem = {
  id: string;
  image: string;
  category: string;
};

export default function WardrobeScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [items, setItems] = useState<ClothingItem[]>([]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });

    if (!result.canceled) {
      const newItem: ClothingItem = {
        id: Date.now().toString(),
        image: result.assets[0].uri,
        category: "Tops",
      };
      setItems((prev) => [...prev, newItem]);
    }
  };

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Decorative blob — matches home page */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconCircle}>
          <Ionicons name="person-outline" size={20} color="#555" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Ionicons
            name="sparkles"
            size={14}
            color="#6B4EFF"
            style={styles.sparkle}
          />
          <Text style={styles.logo}>Kiova</Text>
        </View>

        <TouchableOpacity style={styles.iconCircle}>
          <Ionicons name="notifications-outline" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title Row */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{"Your\nwardrobe"}</Text>
          <TouchableOpacity style={styles.blackButton} onPress={pickImage}>
            <Feather name="plus" size={16} color="white" />
            <Text style={styles.blackButtonText}>Add item</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          All your clothing pieces, organised in one place.
        </Text>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.label)}
              style={[
                styles.filterButton,
                selectedCategory === cat.label && styles.activeFilter,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === cat.label && styles.activeFilterText,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        

        {/* Grid or Empty State */}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="shopping-bag" size={28} color="#bbb" />
            </View>
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptySub}>
              Tap "Add item" to start building your wardrobe.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={pickImage}>
              <Feather name="plus" size={16} color="white" />
              <Text style={styles.emptyButtonText}>Add your first item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredItems.map((item) => (
              <View key={item.id} style={styles.card}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <View style={styles.cardTag}>
                  <Text style={styles.cardTagText}>{item.category}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F3F0",  // ← exact home page background
  },

  blob1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#F4C4C4',
    opacity: 0.35,
  },

  blob2: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#D4C8F0',
    opacity: 0.35,
  },

  topBar: {
    marginTop: 58,
    marginBottom: 8,
    paddingHorizontal: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.75)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

  logoContainer: {
    alignItems: "center",
  },

  sparkle: {
    marginBottom: -2,
  },

  logo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F4A261",
    letterSpacing: 0.5,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 60,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 28,
  },

  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#1a1a1a",
    lineHeight: 48,
  },

  blackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 30,
    gap: 6,
    marginBottom: 6,
  },

  blackButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },

  subtitle: {
    marginTop: 10,
    color: "#888",
    fontSize: 14,
    lineHeight: 20,
  },

  filterScroll: {
    marginTop: 22,
    flexGrow: 0,
  },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 10,
  },

  filterButton: {
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
  },

  activeFilter: {
    backgroundColor: "#1a1a1a",
    borderColor: "#1a1a1a",
  },

  filterText: {
    fontWeight: "600",
    color: "#444",
    fontSize: 14,
  },

  activeFilterText: {
    color: "white",
  },

  savedCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 18,
    padding: 18,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

  savedCardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  savedCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  savedCardSub: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },

  emptyState: {
    alignItems: "center",
    marginTop: 50,
    paddingHorizontal: 20,
  },

  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },

  emptySub: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
  },

  emptyButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
    gap: 12,
  },

  card: {
    width: (width - 56) / 2,
    height: 210,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  cardTag: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  cardTagText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
});