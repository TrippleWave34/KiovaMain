import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 48) / 2; // Define CARD_SIZE

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
  const [showTokens, setShowTokens] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state

  const isWardrobe = view === "wardrobe";
  const items = isWardrobe ? wardrobeItems : savedItems;

  const pickImage = async () => {
    setLoading(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Please grant permission to access your photos");
        return;
      }

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
          category: "Tops", // You might want to let user select category
        };
        if (isWardrobe) {
          setWardrobeItems((prev) => [...prev, newItem]);
        } else {
          setSavedItems((prev) => [...prev, newItem]);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (id: string) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (isWardrobe) {
              setWardrobeItems((prev) => prev.filter((i) => i.id !== id));
            } else {
              setSavedItems((prev) => prev.filter((i) => i.id !== id));
            }
          }
        }
      ]
    );
  };

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  // Render each grid item
  const renderItem = ({ item }: { item: ClothingItem }) => (
    <TouchableOpacity
      style={styles.card}
      onLongPress={() => removeItem(item.id)}
      delayLongPress={500}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.categoryTag}>
        <Text style={styles.categoryText}>{item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#F8F5FF', '#F9F2F5', '#F5F8FF']}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Wardrobe</Text>
          <Text style={styles.subtitle}>
            Add items and organize your looks.
          </Text>
        </View>

        <TouchableOpacity style={styles.iconCircle}>
          <Ionicons name="notifications-outline" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, isWardrobe && styles.activeToggle]}
          onPress={() => setView("wardrobe")}
        >
          <Text style={[styles.toggleText, isWardrobe && styles.activeToggleText]}>
            Wardrobe
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, !isWardrobe && styles.activeToggle]}
          onPress={() => setView("saved")}
        >
          <Text style={[styles.toggleText, !isWardrobe && styles.activeToggleText]}>
            Saved
          </Text>
        </TouchableOpacity>
      </View>

      {/* Title row with buttons */}
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>
          {isWardrobe ? "Your Wardrobe" : "Saved Items"}
        </Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={pickImage}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.btnText}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
            key={cat.id} // Use cat.id, not cat
            style={[
              styles.pill,
              selectedCategory === cat.label && styles.activePill, // Compare with cat.label
            ]}
            onPress={() => setSelectedCategory(cat.label)} // Use cat.label
          >
            <Text
              style={[
                styles.pillText,
                selectedCategory === cat.label && { color: '#fff' }, // Use cat.label
              ]}
            >
              {cat.label} {/* Use cat.label */}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* GRID */}
      {filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 16 }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No items yet</Text>
          <Text style={styles.emptySubtext}>Tap Add to add clothing items</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
  },
  subtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 25,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 21,
  },
  activeToggle: {
    backgroundColor: '#111',
  },
  toggleText: {
    fontWeight: '500',
    color: '#666',
  },
  activeToggleText: {
    color: '#fff',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingHorizontal: 16,
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
  activePill: {
    backgroundColor: '#111',
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
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});