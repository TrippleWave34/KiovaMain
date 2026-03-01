import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48 - 16) / 3;

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
  { id: '4', name: '', items: ['Knit Top', 'Midi Skirt', 'Mules'], date: '25 Feb' },
  { id: '5', name: '', items: ['Denim Jacket', 'Jeans', 'White Tee'], date: '24 Feb' },
  { id: '6', name: '', items: ['Coat', 'Turtleneck', 'Boots'], date: '23 Feb' },
];

export default function SavedOutfit() {
  const [outfits, setOutfits] = useState<Outfit[]>(MOCK_OUTFITS);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);

  const openDetail = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
    setDetailVisible(true);
  };

  const openRename = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
    setNameInput(outfit.name);
    setModalVisible(true);
  };

  const saveName = () => {
    if (!selectedOutfit) return;
    setOutfits((prev) =>
      prev.map((o) => (o.id === selectedOutfit.id ? { ...o, name: nameInput } : o))
    );
    setModalVisible(false);
  };

  const deleteOutfit = (id: string) => {
    setOutfits((prev) => prev.filter((o) => o.id !== id));
    setDetailVisible(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Saved Outfits</Text>
          <Text style={styles.subtitle}>{outfits.length} looks saved</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✦ My Looks</Text>
        </View>
      </View>

      {outfits.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={48} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No saved outfits yet</Text>
          <Text style={styles.emptySubtitle}>
            Generate an outfit on the home screen and save it here.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {outfits.map((outfit) => (
            <TouchableOpacity
              key={outfit.id}
              style={styles.card}
              onPress={() => openDetail(outfit)}
            >
              <View style={styles.cardImage}>
                <Ionicons name="sparkles" size={20} color="#CCCCCC" />
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {outfit.name || 'Untitled'}
                </Text>
                <TouchableOpacity onPress={() => openRename(outfit)}>
                  <Ionicons name="pencil-outline" size={11} color="#888" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 110, width: '100%' }} />
        </ScrollView>
      )}

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

      {/* Detail Bottom Sheet */}
      <Modal visible={detailVisible} transparent animationType="slide">
        <View style={styles.detailOverlay}>
          <View style={styles.detailBox}>
            <View style={styles.handle} />

            <View style={styles.detailImage}>
              <Ionicons name="sparkles" size={48} color="#CCCCCC" />
              <Text style={styles.detailImageText}>AI Generated Outfit</Text>
            </View>

            <View style={styles.detailInfo}>
              <View style={styles.detailNameRow}>
                <Text style={styles.detailName}>
                  {selectedOutfit?.name || 'Untitled'}
                </Text>
                <TouchableOpacity onPress={() => {
                  setDetailVisible(false);
                  if (selectedOutfit) openRename(selectedOutfit);
                }}>
                  <Ionicons name="pencil-outline" size={16} color="#888" />
                </TouchableOpacity>
              </View>
              <Text style={styles.detailDate}>Saved {selectedOutfit?.date}</Text>

              <Text style={styles.detailItemsLabel}>Clothes used</Text>
              <View style={styles.detailItems}>
                {selectedOutfit?.items.map((item, i) => (
                  <View key={i} style={styles.itemChip}>
                    <Text style={styles.itemChipText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.detailActions}>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => selectedOutfit && deleteOutfit(selectedOutfit.id)}
              >
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailVisible(false)}>
                <Text style={styles.closeBtnText}>Close</Text>
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
    paddingTop: 16, marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 4 },
  badge: {
    backgroundColor: '#F0EDFF', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#6B4EFF', letterSpacing: 1 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 24, gap: 8,
  },
  card: {
    width: CARD_SIZE, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)', overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: CARD_SIZE * 0.9,
    backgroundColor: '#EEECEA', alignItems: 'center', justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 7,
  },
  cardName: { fontSize: 10, fontWeight: '600', color: '#1A1A1A', flex: 1, marginRight: 4 },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#444', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
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
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  detailBox: {
    backgroundColor: '#F5F3F0', borderTopLeftRadius: 32,
    borderTopRightRadius: 32, paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#CCCCCC', alignSelf: 'center', marginTop: 12, marginBottom: 20,
  },
  detailImage: {
    height: 260, marginHorizontal: 24, borderRadius: 24,
    backgroundColor: '#EEECEA', alignItems: 'center',
    justifyContent: 'center', marginBottom: 20, gap: 10,
  },
  detailImageText: { fontSize: 14, color: '#AAAAAA' },
  detailInfo: { paddingHorizontal: 24 },
  detailNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  detailName: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  detailDate: { fontSize: 13, color: '#888', marginBottom: 16 },
  detailItemsLabel: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 10 },
  detailItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  itemChip: {
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  itemChipText: { fontSize: 12, fontWeight: '600', color: '#1A1A1A' },
  detailActions: { flexDirection: 'row', paddingHorizontal: 24, gap: 12 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 14, paddingHorizontal: 20,
    borderRadius: 50, backgroundColor: '#FFE5E5',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: '#FF3B30' },
  closeBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 50,
    backgroundColor: '#1A1A1A', alignItems: 'center',
  },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});