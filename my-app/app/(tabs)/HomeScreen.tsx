import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

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

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState('1');
  const wardrobeIsEmpty = true;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="person-outline" size={20} color="#3B3B3B" />
          </TouchableOpacity>
          <View style={styles.logoWrapper}>
            <Text style={styles.logoText}>Kiova</Text>
            <Ionicons name="star" size={20} color="#4B0082" style={styles.logoStar} />
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color="#3B3B3B" />
          </TouchableOpacity>
        </View>

        {/* Heading + Your Clothes button */}
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Craft your fit{'\n'}with Kiova</Text>
          <TouchableOpacity style={styles.yourClothesBtn}>
            <Ionicons name="bookmark" size={13} color="#fff" style={{ marginRight: 5 }} />
            <Text style={styles.yourClothesText}>Your clothes</Text>
          </TouchableOpacity>
        </View>

        {/* Category filters */}
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

        {/* Wardrobe area */}
        <View style={styles.wardrobeBox}>
          {wardrobeIsEmpty ? (
            <View style={styles.emptyState}>
              <Ionicons name="information-circle-outline" size={28} color="#AAAAAA" />
              <Text style={styles.emptyTitle}>Your wardrobe is empty</Text>
              <Text style={styles.emptySubtitle}>
                Go to Wardrobe and add some clothes. Then come back to pick them here.
              </Text>
            </View>
          ) : (
            <Text style={styles.emptyTitle}>Your clothes will appear here</Text>
          )}
        </View>

        {/* Outfit Generator */}
        <View style={styles.generatorSection}>
          <Text style={styles.generatorTitle}>Outfit generator</Text>
          <Text style={styles.generatorSub}>
            Pick pieces above. They show here, then Generate to build an outfit.
          </Text>

          <View style={styles.slotsRow}>
            {Array.from({ length: SLOT_COUNT }).map((_, i) => (
              <View key={i} style={styles.slot} />
            ))}
          </View>

          <View style={styles.previewBox}>
            <Ionicons name="sparkles" size={28} color="#CCCCCC" />
            <Text style={styles.previewText}>Generated outfit preview</Text>
          </View>

          <TouchableOpacity style={styles.generateBtn}>
            <Text style={styles.generateText}>Generate</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F3F0',
  },
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
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F5A623',
    letterSpacing: 0.5,
  },
  logoStar: {
    position: 'absolute',
    top: -10,
    left: 18,
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 34,
    flex: 1,
  },
  yourClothesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginLeft: 12,
    marginTop: 4,
  },
  yourClothesText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
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
  categoryChipActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  categoryText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  wardrobeBox: {
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    padding: 24,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
  generatorSection: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 20,
  },
  generatorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  generatorSub: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  slot: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  previewBox: {
    height: 220,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  previewText: {
    fontSize: 14,
    color: '#AAAAAA',
  },
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
  generateText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});