import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../AuthContext';

const { width, height } = Dimensions.get('window');

type SavedOutfitItem = {
  id: string;
  image: string;
  createdAt: number;
  name?: string;
  items?: string[];
};

type Outfit = {
  id: string;
  name: string;
  image: string;
  createdAt: number;
  date: string;
  items: string[];
};

function formatDate(ts: number) {
  try {
    const d = new Date(ts);
    const day = d.getDate();
    const month = d.toLocaleString('en-GB', { month: 'short' });
    return `${day} ${month}`;
  } catch {
    return '—';
  }
}

export default function SavedOutfit() {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const flatListRef = useRef<FlatList<Outfit>>(null);

  const currentOutfit = outfits[currentIndex];

  const getKey = () => `kiova:saved_outfits:${user?.uid}`;

  const loadOutfits = async () => {
    try {
      const raw = await AsyncStorage.getItem(getKey());
      const parsed = raw ? (JSON.parse(raw) as SavedOutfitItem[]) : [];
      const safe = Array.isArray(parsed) ? parsed : [];

      const mapped: Outfit[] = safe
        .filter((x) => x && typeof x.image === 'string' && x.image.length > 0)
        .map((x) => {
          const createdAt = Number(x.createdAt || Date.now());
          return {
            id: String(x.id),
            name: (x.name ?? '').toString(),
            image: x.image,
            createdAt,
            date: formatDate(createdAt),
            items: Array.isArray(x.items) ? x.items : [],
          };
        });

      setOutfits(mapped);
      setCurrentIndex((prev) => {
        if (mapped.length === 0) return 0;
        return Math.min(prev, mapped.length - 1);
      });
    } catch (e) {
      console.log('SavedOutfit load error:', e);
      setOutfits([]);
      setCurrentIndex(0);
    }
  };

  const persistOutfits = async (next: Outfit[]) => {
    try {
      const toStore: SavedOutfitItem[] = next.map((o) => ({
        id: o.id,
        image: o.image,
        createdAt: o.createdAt,
        name: o.name,
        items: o.items,
      }));
      await AsyncStorage.setItem(getKey(), JSON.stringify(toStore));
    } catch (e) {
      console.log('SavedOutfit persist error:', e);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    loadOutfits();
    const interval = setInterval(loadOutfits, 1200);
    return () => clearInterval(interval);
  }, [user?.uid]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const openRename = () => {
    if (!currentOutfit) return;
    setNameInput(currentOutfit.name || '');
    setModalVisible(true);
  };

  const saveName = () => {
    setOutfits((prev) => {
      const next = prev.map((o, i) => (i === currentIndex ? { ...o, name: nameInput } : o));
      persistOutfits(next);
      return next;
    });
    setModalVisible(false);
  };

  const deleteOutfit = () => {
    setOutfits((prev) => {
      const updated = prev.filter((_, i) => i !== currentIndex);
      const newIndex = Math.min(currentIndex, updated.length - 1);
      setCurrentIndex(newIndex < 0 ? 0 : newIndex);
      setTimeout(() => {
        if (updated.length > 0 && newIndex >= 0) {
          flatListRef.current?.scrollToIndex({ index: newIndex, animated: false });
        }
      }, 100);
      persistOutfits(updated);
      return updated;
    });
  };

  if (outfits.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={52} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No saved outfits yet</Text>
          <Text style={styles.emptySubtitle}>Generate an outfit on the home screen and save it here.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Saved Outfits</Text>
          <Text style={styles.subtitle}>
            {currentIndex + 1} of {outfits.length}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✦ My Looks</Text>
        </View>
      </View>

      <View style={styles.dots}>
        {outfits.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      <FlatList
        ref={flatListRef}
        data={outfits}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <View style={styles.outfitImage}>
              <Image source={{ uri: item.image }} style={styles.outfitImgActual} resizeMode="contain" />
              {item.items.length > 0 && (
                <View style={styles.itemsStack}>
                  {item.items.slice(0, 6).map((url, i) => (
                    <Image key={i} source={{ uri: url }} style={styles.itemThumb} resizeMode="cover" />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.infoCard}>
              <View style={styles.nameRow}>
                <View>
                  <Text style={styles.outfitName}>{item.name || 'Untitled'}</Text>
                  <Text style={styles.outfitDate}>Saved {item.date}</Text>
                </View>
                <TouchableOpacity style={styles.renameBtn} onPress={openRename}>
                  <Ionicons name="pencil-outline" size={14} color="#6B4EFF" />
                  <Text style={styles.renameBtnText}>Rename</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.deleteBtn} onPress={deleteOutfit}>
                <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                <Text style={styles.deleteBtnText}>Delete outfit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Name this outfit</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="e.g. Summer Fit"
              placeholderTextColor="#AAAAAA"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveName}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F3F0' },
  blobTopRight: { position: 'absolute', top: -60, right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: '#F4C4C4', opacity: 0.35 },
  blobBottomLeft: { position: 'absolute', bottom: 100, left: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: '#D4C8F0', opacity: 0.35 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, paddingTop: 16, marginBottom: 10 },
  title:    { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 4 },
  badge:    { backgroundColor: '#F0EDFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#6B4EFF', letterSpacing: 1 },
  dots:      { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 12 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D0CCE8' },
  dotActive: { width: 20, backgroundColor: '#6B4EFF' },
  page: { width, paddingHorizontal: 40, paddingBottom: 110 },
  outfitImage: { width: '100%', height: height * 0.52, borderRadius: 28, backgroundColor: '#EEECEA', marginBottom: 12, marginTop: 2, overflow: 'hidden' },
  outfitImgActual: { width: '100%', height: '100%' },
  itemsStack: { position: 'absolute', top: 12, left: 12, flexDirection: 'column', gap: 5 },
  itemThumb: { width: 38, height: 38, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)' },
  infoCard: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20, padding: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  outfitName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  outfitDate: { fontSize: 11, color: '#888', marginTop: 1 },
  renameBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0EDFF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  renameBtnText: { fontSize: 12, fontWeight: '700', color: '#6B4EFF' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 50, backgroundColor: '#FFE5E5' },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: '#FF3B30' },
  emptyState:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: '#444', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalBox:     { width: '80%', backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  modalTitle:   { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  modalInput:   { backgroundColor: '#F5F3F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A1A', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalCancel:  { flex: 1, paddingVertical: 12, borderRadius: 50, backgroundColor: '#F0EDFF', alignItems: 'center' },
  modalCancelText: { fontWeight: '700', color: '#6B4EFF' },
  modalSave:    { flex: 1, paddingVertical: 12, borderRadius: 50, backgroundColor: '#1A1A1A', alignItems: 'center' },
  modalSaveText: { fontWeight: '700', color: '#fff' },
});
