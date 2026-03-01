import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

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
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [savedItems, setSavedItems] = useState<ClothingItem[]>([]);
  const [view, setView] = useState<"wardrobe" | "saved">("wardrobe");
  const [showTokens, setShowTokens] = useState(false); // ← token modal state

  const isWardrobe = view === "wardrobe";
  const items = isWardrobe ? wardrobeItems : savedItems;

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
      if (isWardrobe) {
        setWardrobeItems((prev) => [...prev, newItem]);
      } else {
        setSavedItems((prev) => [...prev, newItem]);
      }
    }
  };

  const removeItem = (id: string) => {
    if (isWardrobe) {
      setWardrobeItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setSavedItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#F8F5FF', '#F9F2F5', '#F5F8FF']}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your wardrobe</Text>
          <Text style={styles.subtitle}>
            Add items and organize your looks.
          </Text>
        </View>

        <TouchableOpacity style={styles.iconCircle}>
          <Ionicons name="notifications-outline" size={20} color="#555" />
        </TouchableOpacity>

      </View>

      {/* Title row with buttons */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{"Your wa\nrdrobe"}</Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.savedBtn}>
            <Ionicons name="bookmark" size={16} color="#fff" />
            <Text style={styles.btnText}>Saved</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={pickImage}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.btnText}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          All your clothing pieces, organised in one place.
        </Text>

      {/* CATEGORY FILTER */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 10 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.pill,
              selectedCategory === cat && styles.activePill,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.pillText,
                selectedCategory === cat && { color: '#fff' },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* GRID */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 16 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  savedBtn: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EAEAEA',
    borderRadius: 20,
    marginRight: 8,
  },

  activeFilter: {
    backgroundColor: "#1a1a1a",
    borderColor: "#1a1a1a",
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.3,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});