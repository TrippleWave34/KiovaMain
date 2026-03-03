import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import TokenModal from '../payment';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const BACKEND_URL = 'http://10.0.2.2:8001';

const CATEGORIES = [
  { id: '1', label: 'All' },
  { id: '2', label: 'Tops' },
  { id: '3', label: 'Bottoms' },
  { id: '4', label: 'Outerwear' },
  { id: '5', label: 'Dresses' },
  { id: '6', label: 'Activewear' },
  { id: '7', label: 'Shoes' },
  { id: '8', label: 'Accessories' },
];

type ClothingItem = {
  id: string;
  image: string; // URL http(s)
  category: string;
};

const WARDROBE_KEY = 'kiova:wardrobe_items';

async function uploadImageToBackend(localUri: string): Promise<string> {
  const filename = localUri.split('/').pop() || `img_${Date.now()}.jpg`;
  const ext = (filename.split('.').pop() || 'jpg').toLowerCase();

  const mime =
    ext === 'png'
      ? 'image/png'
      : ext === 'webp'
      ? 'image/webp'
      : 'image/jpeg';

  const form = new FormData();
  form.append(
    'image',
    {
      uri: localUri,
      name: filename,
      type: mime,
    } as any
  );

  const res = await fetch(`${BACKEND_URL}/save-image`, {
    method: 'POST',
    body: form,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || data?.message || `Upload failed (${res.status})`;
    throw new Error(msg);
  }

  const url = data?.image_url;
  if (typeof url !== 'string' || !url.length) {
    throw new Error('Upload succeeded but missing image_url');
  }

  return url;
}

export default function WardrobeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [showTokens, setShowTokens] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(WARDROBE_KEY);
        const parsed = raw ? (JSON.parse(raw) as ClothingItem[]) : [];
        setWardrobeItems(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.log('WardrobeScreen load error:', e);
        setWardrobeItems([]);
      }
    };
    load();
  }, []);

  const saveWardrobe = async (next: ClothingItem[]) => {
    try {
      await AsyncStorage.setItem(WARDROBE_KEY, JSON.stringify(next));
    } catch (e) {
      console.log('WardrobeScreen save error:', e);
    }
  };

  const pickImage = async () => {
    if (uploading) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload clothing items.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });

    if (result.canceled) return;

    try {
      setUploading(true);

      const localUri = result.assets[0].uri;
      const uploadedUrl = await uploadImageToBackend(localUri);

      const newItem: ClothingItem = {
        id: Date.now().toString(),
        image: uploadedUrl,
        category: 'Tops', // default
      };

      setWardrobeItems((prev) => {
        const next = [newItem, ...prev];
        saveWardrobe(next);
        return next;
      });
    } catch (e: any) {
      console.log('Upload error:', e);
      Alert.alert('Upload failed', e?.message || 'Could not upload image.');
    } finally {
      setUploading(false);
    }
  };

  const removeItem = (id: string) => {
    setWardrobeItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveWardrobe(next);
      return next;
    });
  };

  const filteredItems =
    selectedCategory === 'All'
      ? wardrobeItems
      : wardrobeItems.filter((item) => item.category === selectedCategory);

  return (
    <View style={styles.container}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => setShowTokens(true)}>
          <Ionicons name="person-outline" size={20} color="#555" />
        </TouchableOpacity>

        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity style={styles.iconCircle}>
          <Ionicons name="notifications-outline" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Your{'\n'}wardrobe</Text>

          <TouchableOpacity style={styles.blackButton} onPress={pickImage}>
            <Feather name="plus" size={15} color="white" />
            <Text style={styles.blackButtonText}>{uploading ? 'Uploading...' : 'Add item'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>All your clothing pieces, organised in one place.</Text>

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
              style={[styles.filterButton, selectedCategory === cat.label && styles.activeFilter]}
            >
              <Text style={[styles.filterText, selectedCategory === cat.label && styles.activeFilterText]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="shopping-bag" size={28} color="#bbb" />
            </View>
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptySub}>Tap "Add item" to start building your wardrobe.</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={pickImage}>
              <Feather name="plus" size={16} color="white" />
              <Text style={styles.emptyButtonText}>Add your first item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.card} onLongPress={() => removeItem(item.id)}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <View style={styles.cardTag}>
                  <Text style={styles.cardTagText}>{item.category}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <TokenModal visible={showTokens} onClose={() => setShowTokens(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3F0' },

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  logoWrapper: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 120, height: 40 },

  scrollContent: { paddingHorizontal: 22, paddingBottom: 60 },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 28,
  },
  title: { fontSize: 42, fontWeight: '800', color: '#1a1a1a', lineHeight: 48 },

  blackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 30,
    gap: 6,
    justifyContent: 'center',
    marginBottom: 6,
  },
  blackButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },

  subtitle: { marginTop: 10, color: '#888', fontSize: 14, lineHeight: 20 },

  filterScroll: { marginTop: 22, flexGrow: 0 },
  filterRow: { flexDirection: 'row', gap: 8, paddingRight: 10 },

  filterButton: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  activeFilter: { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
  filterText: { fontWeight: '600', color: '#444', fontSize: 14 },
  activeFilterText: { color: 'white' },

  emptyState: { alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
  },
  emptyButtonText: { color: 'white', fontWeight: '700', fontSize: 15 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, gap: 12 },
  card: {
    width: (width - 56) / 2,
    height: 210,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  image: { width: '100%', height: '100%' },
  cardTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  cardTagText: { color: 'white', fontSize: 11, fontWeight: '600' },
});