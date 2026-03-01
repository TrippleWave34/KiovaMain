import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type Outfit = {
  id: string;
  name: string;
  items: string[];
  date: string;
};

const MOCK_OUTFITS: Outfit[] = [
  { id: '1', name: 'Summer Fit', items: ['White Tee', 'Linen Trousers', 'Loafers'], date: '28 Feb' },
  { id: '2', name: 'Street Look', items: ['Hoodie', 'Cargo Pants', 'Sneakers'], date: '27 Feb' },
  { id: '3', name: 'Smart Casual', items: ['Blazer', 'Chinos', 'Derby Shoes'], date: '26 Feb' },
  { id: '4', name: 'Evening Out', items: ['Knit Top', 'Midi Skirt', 'Mules'], date: '25 Feb' },
  { id: '5', name: '', items: ['Denim Jacket', 'Jeans', 'White Tee'], date: '24 Feb' },
  { id: '6', name: '', items: ['Coat', 'Turtleneck', 'Boots'], date: '23 Feb' },
];

export default function SavedOutfit() {
  const [outfits, setOutfits] = useState<Outfit[]>(MOCK_OUTFITS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const flatListRef = useRef<FlatList<Outfit>>(null);

  const currentOutfit = outfits[currentIndex];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const openRename = () => {
    setNameInput(currentOutfit.name);
    setModalVisible(true);
  };

  const saveName = () => {
    setOutfits((prev) =>
      prev.map((o, i) => (i === currentIndex ? { ...o, name: nameInput } : o))
    );
    setModalVisible(false);
  };

  const deleteOutfit = () => {
    const updated = outfits.filter((_, i) => i !== currentIndex);
    setOutfits(updated);
    const newIndex = Math.min(currentIndex, updated.length - 1);
    setCurrentIndex(newIndex);
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: false });
    }, 100);
  };

  if (outfits.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={52} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No saved outfits yet</Text>
          <Text style={styles.emptySubtitle}>
            Generate an outfit on the home screen and save it here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      {/* Header */}
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

      {/* Dot indicators */}
      <View style={styles.dots}>
        {outfits.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      {/* Horizontal swipe gallery */}
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
            {/* Big outfit image */}
            <View style={styles.outfitImage}>
              <Ionicons name="sparkles" size={52} color="#CCCCCC" />
              <Text style={styles.outfitImageText}>AI Generated Outfit</Text>
            </View>

            {/* Outfit info card */}
            <View style={styles.infoCard}>
              {/* Name row */}
              <View style={styles.nameRow}>
                <Text style={styles.outfitName}>{item.name || 'Untitled'}</Text>
                <TouchableOpacity style={styles.renameBtn} onPress={openRename}>
                  <Ionicons name="pencil-outline" size={15} color="#6B4EFF" />
                  <Text style={styles.renameBtnText}>Rename</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.outfitDate}>Saved {item.date}</Text>

              {/* Clothes used */}
              <Text style={styles.itemsLabel}>Clothes used</Text>
              <View style={styles.itemsRow}>
                {item.items.map((cloth, i) => (
                  <View key={i} style={styles.itemChip}>
                    <Ionicons name="shirt-outline" size={12} color="#6B4EFF" />
                    <Text style={styles.itemChipText}>{cloth}</Text>
                  </View>
                ))}
              </View>

              {/* Delete */}
              <TouchableOpacity style={styles.deleteBtn} onPress={deleteOutfit}>
                <Ionicons name="trash-outline" size={15} color="#FF3B30" />
                <Text style={styles.deleteBtnText}>Delete outfit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Rename Modal */}
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
  blobTopRight: {
    position: 'absolute', top: -60, right: -60,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: '#F4C4C4', opacity: 0.35,
  },
  blobBottomLeft: {
    position: 'absolute', bottom: 100, left: -80,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#D4C8F0', opacity: 0.35,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 24,
    paddingTop: 16, marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 4 },
  badge: {
    backgroundColor: '#F0EDFF', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#6B4EFF', letterSpacing: 1 },

  // Dots
  dots: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 6, marginBottom: 16,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#D0CCE8',
  },
  dotActive: {
    width: 20, backgroundColor: '#6B4EFF',
  },

  // Page
  page: {
    width,
    paddingHorizontal: 20,
    paddingBottom: 110,
  },

  // Outfit image area
  outfitImage: {
    width: '100%',
    height: height * 0.42,
    borderRadius: 28,
    backgroundColor: '#EEECEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  outfitImageText: { fontSize: 14, color: '#AAAAAA' },

  // Info card
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 24,
    padding: 20,
  },
  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  outfitName: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  renameBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0EDFF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  renameBtnText: { fontSize: 12, fontWeight: '700', color: '#6B4EFF' },
  outfitDate: { fontSize: 13, color: '#888', marginBottom: 16 },
  itemsLabel: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 10 },
  itemsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  itemChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F0EDFF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  itemChipText: { fontSize: 12, fontWeight: '600', color: '#1A1A1A' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 50,
    backgroundColor: '#FFE5E5',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: '#FF3B30' },

  // Empty state
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#444', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalBox: { width: '80%', backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  modalInput: {
    backgroundColor: '#F5F3F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1A1A1A', marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalCancel: {
    flex: 1, paddingVertical: 12, borderRadius: 50,
    backgroundColor: '#F0EDFF', alignItems: 'center',
  },
  modalCancelText: { fontWeight: '700', color: '#6B4EFF' },
  modalSave: {
    flex: 1, paddingVertical: 12, borderRadius: 50,
    backgroundColor: '#1A1A1A', alignItems: 'center',
  },
  modalSaveText: { fontWeight: '700', color: '#fff' },
});