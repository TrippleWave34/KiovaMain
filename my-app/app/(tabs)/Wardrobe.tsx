import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 40) / 2;

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Dresses', 'Shoes'];

type ClothingItem = {
  id: string;
  uri: string;
  category: string;
};

export default function Wardrobe() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  const filtered =
    selectedCategory === 'All'
      ? items
      : items.filter((item) => item.category === selectedCategory);

  const pickImage = useCallback(async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow gallery access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) return;

    const image = result.assets[0];

    Alert.alert('Select Category', '', [
      ...CATEGORIES.filter((c) => c !== 'All').map((cat) => ({
        text: cat,
        onPress: () => {
          const newItem = {
            id: Date.now().toString(),
            uri: image.uri,
            category: cat,
          };

          setItems((prev) => [...prev, newItem]);
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const renderItem = ({ item }: { item: ClothingItem }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.uri }} style={styles.image} />
    </View>
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
          <Text style={styles.title}>Your wardrobe</Text>
          <Text style={styles.subtitle}>
            Add items and organize your looks.
          </Text>
        </View>

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
      </View>

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
  },
  image: {
    width: '100%',
    height: '100%',
  },
});