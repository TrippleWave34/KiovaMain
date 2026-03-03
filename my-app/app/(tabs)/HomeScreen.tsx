import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Image } from 'react-native';
import TokenModal from '../payment';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = 'http://10.1.24.78:8001'; // emulator Android. Sur tel: IP de ton PC

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

const SLOT_COUNT = 6;

type ClothingItem = {
  id: string;
  image: string; // URL http(s)
  category: string; // "Tops", "Bottoms", etc.
};

type SavedOutfitItem = {
  id: string;
  image: string;
  createdAt: number;
  name?: string;
};

const WARDROBE_KEY = 'kiova:wardrobe_items';
const SAVED_OUTFITS_KEY = 'kiova:saved_outfits';

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState('1');
  const [showTokens, setShowTokens] = useState(false);

  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);

  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedOutfitUrl, setGeneratedOutfitUrl] = useState<string | null>(null);

  // Load wardrobe from AsyncStorage
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(WARDROBE_KEY);
        const items = raw ? (JSON.parse(raw) as ClothingItem[]) : [];
        setWardrobeItems(Array.isArray(items) ? items : []);
      } catch (e) {
        console.log('HomeScreen load wardrobe error:', e);
        setWardrobeItems([]);
      }
    };

    load();
    const interval = setInterval(load, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeCategoryLabel = useMemo(() => {
    const found = CATEGORIES.find((c) => c.id === activeCategory);
    return found?.label ?? 'All';
  }, [activeCategory]);

  const activeItems = useMemo(() => {
    if (activeCategoryLabel === 'All') return wardrobeItems;
    return wardrobeItems.filter((it) => it.category === activeCategoryLabel);
  }, [wardrobeItems, activeCategoryLabel]);

  const wardrobeIsEmpty = activeItems.length === 0;

  const isSelected = (item: ClothingItem) => selectedItems.some((s) => s.id === item.id);

  const toggleSelect = (item: ClothingItem) => {
    setSelectedItems((prev) => {
      const exists = prev.some((s) => s.id === item.id);
      if (exists) return prev.filter((s) => s.id !== item.id);
      if (prev.length >= SLOT_COUNT) return prev;
      return [...prev, item];
    });
    setGeneratedOutfitUrl(null);
  };

  const removeSelectedById = (id: string) => {
    setSelectedItems((prev) => prev.filter((s) => s.id !== id));
    setGeneratedOutfitUrl(null);
  };

  const appendSavedOutfit = async (url: string) => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_OUTFITS_KEY);
      const prev = raw ? (JSON.parse(raw) as SavedOutfitItem[]) : [];
      const safePrev = Array.isArray(prev) ? prev : [];

      const already = safePrev.some((x) => x?.image === url);
      const next: SavedOutfitItem[] = already
        ? safePrev
        : [{ id: Date.now().toString(), image: url, createdAt: Date.now() }, ...safePrev];

      await AsyncStorage.setItem(SAVED_OUTFITS_KEY, JSON.stringify(next));
    } catch (e) {
      console.log('HomeScreen save saved_outfits error:', e);
    }
  };

  const handleGenerate = async () => {
    if (generating) return;
    if (selectedItems.length === 0) return;

    try {
      setGenerating(true);
      setGeneratedOutfitUrl(null);

      const res = await fetch(`${BACKEND_URL}/generate-outfit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: selectedItems.map((s) => s.image) }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.log('generate error:', data);
        Alert.alert('Generate failed', data?.error || data?.message || 'Unknown error');
        return;
      }

      const url = data?.outfit_url;
      if (typeof url === 'string' && url.length > 0) {
        setGeneratedOutfitUrl(url);
        await appendSavedOutfit(url);
      } else {
        console.log('generate: missing outfit_url', data);
        Alert.alert('Generate failed', 'Missing outfit_url in response.');
      }
    } catch (e) {
      console.log('generate exception:', e);
      Alert.alert('Generate failed', 'Network error / backend not reachable.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowTokens(true)}>
            <Ionicons name="person-outline" size={20} color="#3B3B3B" />
          </TouchableOpacity>

          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color="#3B3B3B" />
          </TouchableOpacity>
        </View>

        <View style={styles.headingRow}>
          <Text style={styles.heading}>Craft your fit{'\n'}with Kiova</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, activeCategory === cat.id && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={[styles.categoryText, activeCategory === cat.id && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.wardrobeBox}>
          {wardrobeIsEmpty ? (
            <View style={styles.emptyState}>
              <Ionicons name="information-circle-outline" size={28} color="#AAAAAA" />
              <Text style={styles.emptyTitle}>Your wardrobe is empty</Text>
              <Text style={styles.emptySubtitle}>
                Add clothes in your wardrobe first. Then come back to pick them here.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              snapToInterval={260}
              decelerationRate="fast"
            >
              {activeItems.map((item) => {
                const selected = isSelected(item);
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.9}
                    onPress={() => toggleSelect(item)}
                    style={styles.bigCard}
                  >
                    <Image source={{ uri: item.image }} style={styles.bigImage} resizeMode="cover" />
                    {selected && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.generatorSection}>
          <Text style={styles.generatorTitle}>Outfit generator</Text>
          <Text style={styles.generatorSub}>
            Pick pieces above. They show here, then Generate to build an outfit.
          </Text>

          <View style={styles.slotsRow}>
            {Array.from({ length: SLOT_COUNT }).map((_, i) => {
              const picked = selectedItems[i];
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.slot}
                  activeOpacity={picked ? 0.8 : 1}
                  onPress={() => {
                    if (picked) removeSelectedById(picked.id);
                  }}
                >
                  {picked ? (
                    <Image source={{ uri: picked.image }} style={styles.slotImg} resizeMode="cover" />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.previewBox}>
            {generating ? (
              <ActivityIndicator />
            ) : generatedOutfitUrl ? (
              <Image source={{ uri: generatedOutfitUrl }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <>
                <Ionicons name="sparkles" size={28} color="#CCCCCC" />
                <Text style={styles.previewText}>Generated outfit preview</Text>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} activeOpacity={0.9}>
            <Text style={styles.generateText}>{generating ? 'Generating...' : 'Generate'}</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      <TokenModal visible={showTokens} onClose={() => setShowTokens(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F3F0' },
  blobTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#F4C4C4',
    opacity: 0.35,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#D4C8F0',
    opacity: 0.35,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 12 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  logoImage: { width: 120, height: 40 },

  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  heading: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', lineHeight: 34, flex: 1 },

  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: '#E0DDD8',
  },
  categoryChipActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  categoryText: { fontSize: 13, color: '#444', fontWeight: '500' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },

  wardrobeBox: {
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },

  emptyState: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 20,
    padding: 24,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#444', marginTop: 6 },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },

  carousel: { paddingHorizontal: 20, gap: 14 },

  bigCard: {
    width: 240,
    height: 300,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
  },
  bigImage: { width: '100%', height: '100%' },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  generatorSection: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 20,
  },
  generatorTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  generatorSub: { fontSize: 12, color: '#888', marginBottom: 16 },

  slotsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  slot: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    backgroundColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotImg: { width: '100%', height: '100%' },

  previewBox: {
    height: 460,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  previewText: { fontSize: 14, color: '#AAAAAA' },
  previewImage: { width: '100%', height: '100%' },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    paddingVertical: 14,
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
  },
  generateText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});