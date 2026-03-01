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
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

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
    <LinearGradient
      colors={["#f8d7e3", "#e8d5f0", "#d5e8f8", "#f0e6d8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Top Header */}
      <View style={styles.topBar}>
        {/* Person icon in circle */}
        <TouchableOpacity style={styles.iconCircle}>
          <Ionicons name="person-outline" size={22} color="#555" />
        </TouchableOpacity>

        {/* Logo with sparkle */}
        <View style={styles.logoContainer}>
          <Ionicons
            name="sparkles"
            size={18}
            color="#6B4EFF"
            style={styles.sparkle}
          />
          <Text style={styles.logo}>Kiova</Text>
        </View>

        {/* Bell icon in circle */}
        <TouchableOpacity style={styles.iconCircle}>
          <Ionicons name="notifications-outline" size={22} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Title row with buttons */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{"Your wa\nrdrobe"}</Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.blackButton}>
            <Feather name="bookmark" size={16} color="white" />
            <Text style={styles.blackButtonText}>Saved</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.blackButton} onPress={pickImage}>
            <Feather name="plus" size={16} color="white" />
            <Text style={styles.blackButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        All your pieces live here. Add items, filter by category,{"\n"}
        and build outfits faster.
      </Text>

      {/* Category Filters - horizontal scroll */}
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

      {/* Clothing Grid */}
      <FlatList
        data={filteredItems}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
          </View>
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  topBar: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  logoContainer: {
    alignItems: "center",
  },

  sparkle: {
    marginBottom: -4,
    alignSelf: "center",
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F4A261",
    letterSpacing: 1,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 30,
  },

  title: {
    fontSize: 44,
    fontWeight: "900",
    color: "black",
    lineHeight: 50,
    flex: 1,
  },

  headerButtons: {
    flexDirection: "column",
    gap: 10,
    marginTop: 4,
  },

  blackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 6,
    minWidth: 110,
    justifyContent: "center",
  },

  blackButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },

  subtitle: {
    marginTop: 16,
    color: "#555",
    fontSize: 15,
    lineHeight: 22,
  },

  filterScroll: {
    marginTop: 24,
    flexGrow: 0,
  },

  filterRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 20,
  },

  filterButton: {
    backgroundColor: "rgba(255,255,255,0.75)",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },

  activeFilter: {
    backgroundColor: "#1a1a1a",
    borderColor: "#1a1a1a",
  },

  filterText: {
    fontWeight: "600",
    color: "#333",
    fontSize: 15,
  },

  activeFilterText: {
    color: "white",
  },

  card: {
    width: width / 2 - 30,
    height: 200,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 20,
    margin: 10,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
  },
});