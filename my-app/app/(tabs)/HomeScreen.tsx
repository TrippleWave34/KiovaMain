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
  Platform,
} from 'react-native';

function crossAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Image } from 'react-native';
import TokenModal from '../payment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../AuthContext';

const BACKEND_URL = 'http://127.0.0.1:8001';

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
  image_url: string;
  tags: string[];
};

export default function HomeScreen() {
  const { getToken } = useAuth();
  const [activeCategory, setActiveCategory]         = useState('1');
  const [showTokens, setShowTokens]                 = useState(false);
  const [wardrobeItems, setWardrobeItems]           = useState<ClothingItem[]>([]);
  const [savedItems, setSavedItems]                 = useState<ClothingItem[]>([]);
  const [carouselView, setCarouselView]             = useState<'wardrobe' | 'saved'>('wardrobe');
  const [selectedItems, setSelectedItems]           = useState<ClothingItem[]>([]);
  const [generating, setGenerating]                 = useState(false);
  const [generatedOutfitUrl, setGeneratedOutfitUrl] = useState<string | null>(null);
  const [outfitSaved, setOutfitSaved]               = useState(false);

  const currentItems = carouselView === 'wardrobe' ? wardrobeItems : savedItems;

  // ── Load from backend ───────────────────────────────────────────────────────
  const loadWardrobe = async () => {
    try {
      const token = await getToken();
      const res  = await fetch(`${BACKEND_URL}/wardrobe`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWardrobeItems(data.images    ?? []);
      setSavedItems(data.favourites   ?? []);
    } catch (e) {
      console.log('HomeScreen load wardrobe error:', e);
    }
  };

  useEffect(() => {
    loadWardrobe();
    const interval = setInterval(loadWardrobe, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Category filter ─────────────────────────────────────────────────────────
  const activeCategoryLabel = useMemo(() => {
    return CATEGORIES.find((c) => c.id === activeCategory)?.label ?? 'All';
  }, [activeCategory]);

  const activeItems = useMemo(() => {
    if (activeCategoryLabel === 'All') return currentItems;
    return currentItems.filter((item) =>
      item.tags.some((tag) =>
        tag.toLowerCase().includes(activeCategoryLabel.toLowerCase())
      )
    );
  }, [currentItems, activeCategoryLabel]);

  // ── Selection ───────────────────────────────────────────────────────────────
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

  // ── Delete item from backend ────────────────────────────────────────────────
  const deleteItem = async (item: ClothingItem) => {
    const isWardrobe = wardrobeItems.some((w) => w.id === item.id);
    const endpoint   = isWardrobe ? `/delete-image/${item.id}` : `/delete-favourite/${item.id}`;

    if (isWardrobe) {
      setWardrobeItems((prev) => prev.filter((i) => i.id !== item.id));
    } else {
      setSavedItems((prev) => prev.filter((i) => i.id !== item.id));
    }
    setSelectedItems((prev) => prev.filter((s) => s.id !== item.id));

    try {
      await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
    } catch (e) {
      console.log('Delete failed:', e);
      loadWardrobe();
    }
  };

  const confirmDelete = (item: ClothingItem) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this item from your wardrobe?')) {
        deleteItem(item);
      }
    } else {
      Alert.alert('Remove item', 'Remove this item from your wardrobe?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteItem(item) },
      ]);
    }
  };

  // ── Generate outfit ─────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (generating || selectedItems.length === 0) return;
    try {
      setGenerating(true);
      setGeneratedOutfitUrl(null);
      setOutfitSaved(false);

      const res = await fetch(`${BACKEND_URL}/generate-outfit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({ items: selectedItems.map((s) => s.image_url) }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        setShowTokens(true);
        return;
      }
      if (!res.ok) {
        crossAlert('Generate failed', data?.error || data?.message || 'Unknown error');
        return;
      }

      const url = data?.outfit_url;
      if (typeof url === 'string' && url.length > 0) {
        setGeneratedOutfitUrl(url);
      } else {
        crossAlert('Generate failed', 'Missing outfit_url in response.');
      }
    } catch (e) {
      crossAlert('Generate failed', 'Network error / backend not reachable.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Save outfit to AsyncStorage ─────────────────────────────────────────────
  const saveOutfit = async () => {
    if (!generatedOutfitUrl) return;
    try {
      const key = 'kiova:saved_outfits';
      const raw = await AsyncStorage.getItem(key);
      const existing = raw ? JSON.parse(raw) : [];
      const newEntry = {
        id: Date.now().toString(),
        image: generatedOutfitUrl,
        createdAt: Date.now(),
        name: '',
        items: selectedItems.map((s) => s.image_url),
      };
      await AsyncStorage.setItem(key, JSON.stringify([newEntry, ...existing]));
      setOutfitSaved(true);
      setTimeout(() => setOutfitSaved(false), 2000);
    } catch (e) {
      crossAlert('Could not save outfit', 'Something went wrong.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowTokens(true)}>
            <Ionicons name="person-outline" size={20} color="#3B3B3B" />
          </TouchableOpacity>
          <View style={styles.logoWrapper}>
            <Image source={require('../../assets/images/logo.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color="#3B3B3B" />
          </TouchableOpacity>
        </View>

        <View style={styles.headingRow}>
          <Text style={styles.heading}>Craft your fit{'\n'}with Kiova</Text>
        </View>

        {/* Wardrobe / Saved toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, carouselView === 'wardrobe' && styles.toggleBtnActive]}
            onPress={() => { setCarouselView('wardrobe'); setActiveCategory('1'); }}
          >
            <Text style={[styles.toggleText, carouselView === 'wardrobe' && styles.toggleTextActive]}>Wardrobe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, carouselView === 'saved' && styles.toggleBtnActive]}
            onPress={() => { setCarouselView('saved'); setActiveCategory('1'); }}
          >
            <Text style={[styles.toggleText, carouselView === 'saved' && styles.toggleTextActive]}>Saved</Text>
          </TouchableOpacity>
        </View>

        {/* Category filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
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

        {/* Carousel */}
        <View style={styles.wardrobeBox}>
          {activeItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="information-circle-outline" size={28} color="#AAAAAA" />
              <Text style={styles.emptyTitle}>
                {carouselView === 'wardrobe' ? 'Your wardrobe is empty' : 'Nothing saved yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {carouselView === 'wardrobe'
                  ? 'Add clothes in your wardrobe first.'
                  : 'Save pieces from the Wardrobe tab.'}
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel} snapToInterval={260} decelerationRate="fast">
              {activeItems.map((item) => {
                const selected = isSelected(item);
                return (
                  <View key={item.id} style={styles.bigCard}>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => toggleSelect(item)} style={{ flex: 1 }}>
                      <Image source={{ uri: item.image_url }} style={styles.bigImage} resizeMode="cover" />
                      {selected && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        <Text style={styles.hintText}>Tap to select • Tap 🗑 to remove</Text>

        {/* Outfit generator */}
        <View style={styles.generatorSection}>
          <Text style={styles.generatorTitle}>Outfit generator</Text>
          <Text style={styles.generatorSub}>Pick pieces above. They show here, then Generate to build an outfit.</Text>

          <View style={styles.slotsRow}>
            {Array.from({ length: SLOT_COUNT }).map((_, i) => {
              const picked = selectedItems[i];
              return (
                <TouchableOpacity key={i} style={styles.slot} activeOpacity={picked ? 0.8 : 1} onPress={() => { if (picked) removeSelectedById(picked.id); }}>
                  {picked ? <Image source={{ uri: picked.image_url }} style={styles.slotImg} resizeMode="cover" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.previewBox}>
            {generating ? (
              <ActivityIndicator />
            ) : generatedOutfitUrl ? (
              <>
                <Image source={{ uri: generatedOutfitUrl }} style={styles.previewImage} resizeMode="contain" />
                <TouchableOpacity style={styles.heartBtn} onPress={saveOutfit} activeOpacity={0.8}>
                  <Ionicons name={outfitSaved ? 'heart' : 'heart-outline'} size={20} color={outfitSaved ? '#FF3B6F' : '#fff'} />
                </TouchableOpacity>
              </>
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
  safe:             { flex: 1, backgroundColor: '#F5F3F0' },
  blobTopRight:     { position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: '#F4C4C4', opacity: 0.35 },
  blobBottomLeft:   { position: 'absolute', bottom: 100, left: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: '#D4C8F0', opacity: 0.35 },
  scroll:           { flex: 1 },
  scrollContent:    { paddingTop: 12 },
  topBar:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  iconBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  logoWrapper:      { flexDirection: 'row', alignItems: 'center' },
  logoImage:        { width: 120, height: 40 },
  headingRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 16 },
  heading:          { fontSize: 26, fontWeight: '700', color: '#1A1A1A', lineHeight: 34, flex: 1 },
  toggleRow:        { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  toggleBtn:        { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: '#E0DDD8' },
  toggleBtnActive:  { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  toggleText:       { fontSize: 13, fontWeight: '600', color: '#444' },
  toggleTextActive: { color: '#fff' },
  categoriesContainer: { paddingHorizontal: 20, gap: 8, marginBottom: 20, flexDirection: 'row' },
  categoryChip:     { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: '#E0DDD8' },
  categoryChipActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  categoryText:     { fontSize: 13, color: '#444', fontWeight: '500' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  wardrobeBox:      { marginHorizontal: 20, borderRadius: 20, backgroundColor: 'transparent', marginBottom: 4 },
  emptyState:       { alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 20, padding: 24 },
  emptyTitle:       { fontSize: 15, fontWeight: '600', color: '#444', marginTop: 6 },
  emptySubtitle:    { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 19, maxWidth: 260 },
  hintText:         { textAlign: 'center', fontSize: 11, color: '#BBB', marginTop: 8, marginBottom: 4 },
  carousel:         { paddingHorizontal: 20, gap: 14 },
  bigCard:          { width: 240, height: 300, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.9)', overflow: 'hidden' },
  bigImage:         { width: '100%', height: '100%' },
  selectedBadge:    { position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  generatorSection: { marginHorizontal: 20, marginTop: 20, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.5)', padding: 20 },
  generatorTitle:   { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  generatorSub:     { fontSize: 12, color: '#888', marginBottom: 16 },
  slotsRow:         { flexDirection: 'row', gap: 10, marginBottom: 16 },
  slot:             { width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: '#CCCCCC', backgroundColor: 'rgba(255,255,255,0.6)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  slotImg:          { width: '100%', height: '100%' },
  previewBox:       { height: 460, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16, overflow: 'hidden' },
  previewText:      { fontSize: 14, color: '#AAAAAA' },
  previewImage:     { width: '100%', height: '100%' },
  heartBtn:         { position: 'absolute', bottom: 14, right: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  generateBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A1A', borderRadius: 24, paddingVertical: 14, alignSelf: 'flex-end', paddingHorizontal: 24 },
  generateText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
});
