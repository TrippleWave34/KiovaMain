import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const categories = ["All", "Tops", "Bottoms", "Outerwear"];

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
      allowsEditing: true, // cropping screen
      aspect: [4, 5],
      quality: 1,
    });

    if (!result.canceled) {
      const newItem: ClothingItem = {
        id: Date.now().toString(),
        image: result.assets[0].uri,
        category: "Tops", // placeholder autotag
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
    colors={["#F5F3F0", "#F5F3F0"]}
    style={styles.container}
  >
    {/* Top Header */}
    <View style={styles.topBar}>
      <Ionicons name="person-outline" size={26} color="black" />
      <Text style={styles.logo}>Kiova</Text>
      <Ionicons name="notifications-outline" size={26} color="black" />
    </View>

    {/* Title + Buttons */}
    <View style={styles.headerSection}>
      <Text style={styles.title}>Your wardrobe</Text>

      <View style={styles.headerButtons}>
        <TouchableOpacity style={styles.blackButton}>
          <Feather name="bookmark" size={18} color="white" />
          <Text style={styles.blackButtonText}>Saved</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.blackButton} onPress={pickImage}>
          <Feather name="plus" size={18} color="white" />
          <Text style={styles.blackButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        All your pieces live here. Add items, filter by category,
        and build outfits faster.
      </Text>
    </View>

    {/* Category Filters */}
    <View style={styles.filterRow}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat}
          onPress={() => setSelectedCategory(cat)}
          style={[
            styles.filterButton,
            selectedCategory === cat && styles.activeFilter,
          ]}
        >
          <Text
            style={[
              styles.filterText,
              selectedCategory === cat && styles.activeFilterText,
            ]}
          >
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* Clothing Grid */}
    <FlatList
      data={filteredItems}
      numColumns={2}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 40 }}
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

  logo: {
    fontSize: 26,
    fontWeight: "700",
    color: "#F4A261",
  },

  headerSection: {
    marginTop: 30,
  },

  title: {
    fontSize: 42,
    fontWeight: "700",
    color: "black",
  },

  headerButtons: {
    flexDirection: "row",
    marginTop: 15,
    gap: 10,
  },

  blackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "black",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 6,
  },

  blackButtonText: {
    color: "white",
    fontWeight: "600",
  },

  subtitle: {
    marginTop: 15,
    color: "#555",
    fontSize: 15,
    lineHeight: 22,
  },

  filterRow: {
    flexDirection: "row",
    marginTop: 25,
    gap: 10,
  },

  filterButton: {
    backgroundColor: "#F1F1F1",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },

  activeFilter: {
    backgroundColor: "black",
  },

  filterText: {
    fontWeight: "600",
  },

  activeFilterText: {
    color: "white",
  },

  card: {
    width: width / 2 - 30,
    height: 200,
    backgroundColor: "white",
    borderRadius: 20,
    margin: 10,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  },
);