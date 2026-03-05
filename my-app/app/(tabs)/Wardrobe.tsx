import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, Feather } from "@expo/vector-icons";
import TokenModal from "../payment";
import { useAuth } from "../../AuthContext";

const { width, height } = Dimensions.get("window");

const API_BASE = "https://kiova-fgggb7a3auhxa3cr.swedencentral-01.azurewebsites.net";

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

// Tag colour palette — cycles through these
const TAG_COLORS = [
  { bg: "#F0EDFF", text: "#6B4EFF" },
  { bg: "#FFE9F3", text: "#D63384" },
  { bg: "#E8F5E9", text: "#2E7D32" },
  { bg: "#FFF3E0", text: "#E65100" },
  { bg: "#E3F2FD", text: "#1565C0" },
  { bg: "#F3E5F5", text: "#7B1FA2" },
];

type ClothingItem = {
  id: string;
  image_url: string;
  tags: string[];
};

export default function WardrobeScreen() {
  const { getToken } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [wardrobeItems, setWardrobeItems]       = useState<ClothingItem[]>([]);
  const [savedItems, setSavedItems]             = useState<ClothingItem[]>([]);
  const [view, setView]                         = useState<"wardrobe" | "saved">("wardrobe");
  const [showTokens, setShowTokens]             = useState(false);
  const [uploading, setUploading]               = useState(false);
  const [showPicker, setShowPicker]             = useState(false);

  // Detail modal
  const [detailItem, setDetailItem]             = useState<ClothingItem | null>(null);
  const [showDetail, setShowDetail]             = useState(false);

  // Hidden file input for web
  const fileInputRef = useRef<any>(null);

  const isWardrobe = view === "wardrobe";
  const items      = isWardrobe ? wardrobeItems : savedItems;

  useEffect(() => {
    fetchWardrobe();
  }, []);

  const fetchWardrobe = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res  = await fetch(`${API_BASE}/wardrobe`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWardrobeItems(data.images    ?? []);
      setSavedItems(data.favourites   ?? []);
    } catch (e) {
      console.error("Failed to load wardrobe:", e);
    }
  };

  const uploadImage = async (uri: string, fileObj?: File) => {
    setUploading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not logged in");

      const formData = new FormData();
      if (Platform.OS === "web" && fileObj) {
        formData.append("image", fileObj, fileObj.name);
      } else {
        formData.append("image", { uri, name: "clothing.jpg", type: "image/jpeg" } as any);
      }

      const endpoint = isWardrobe ? "/save-image" : "/save-favourite";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Server error ${res.status}`);

      const newItem: ClothingItem = {
        id:        data.id,
        image_url: data.image_url,
        tags:      data.tags ?? [],
      };

      if (isWardrobe) {
        setWardrobeItems((prev) => [newItem, ...prev]);
      } else {
        setSavedItems((prev) => [newItem, ...prev]);
      }
    } catch (e: any) {
      Alert.alert("Upload failed", e.message ?? "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  const handleWebFileChange = (e: any) => {
    const file: File = e.target.files?.[0];
    if (!file) return;
    const uri = URL.createObjectURL(file);
    uploadImage(uri, file);
    e.target.value = "";
  };

  const takePhoto = async () => {
    setShowPicker(false);
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) { Alert.alert("Permission needed", "Allow camera access."); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 5], quality: 1,
    });
    if (!result.canceled) await uploadImage(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    setShowPicker(false);
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert("Permission needed", "Allow photo library access."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 5], quality: 1,
    });
    if (!result.canceled) await uploadImage(result.assets[0].uri);
  };

  const handleAddItem = () => {
    if (Platform.OS === "web") {
      fileInputRef.current?.click();
    } else {
      setShowPicker(true);
    }
  };

  const removeItem = async (id: string) => {
    const isWardrobeItem = wardrobeItems.some((i) => i.id === id);
    const endpoint = isWardrobeItem ? `/delete-image/${id}` : `/delete-favourite/${id}`;

    if (isWardrobeItem) {
      setWardrobeItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setSavedItems((prev) => prev.filter((i) => i.id !== id));
    }

    // Close detail modal if the deleted item was open
    if (detailItem?.id === id) setShowDetail(false);

    try {
      const token = await getToken();
      await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
    } catch (e) {
      console.error('Delete failed:', e);
      fetchWardrobe();
    }
  };

  const confirmRemove = (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this item?')) removeItem(id);
    } else {
      Alert.alert('Remove item', 'Remove this item?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(id) },
      ]);
    }
  };

  const openDetail = (item: ClothingItem) => {
    setDetailItem(item);
    setShowDetail(true);
  };

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter((item) =>
          item.tags.some((tag) =>
            tag.toLowerCase().includes(selectedCategory.toLowerCase())
          )
        );

  // Derive a display name from the first tag (capitalised) or fallback
  const getItemName = (item: ClothingItem) => {
    if (item.tags.length === 0) return "Clothing Item";
    return item.tags[0].charAt(0).toUpperCase() + item.tags[0].slice(1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Hidden web file input */}
      {Platform.OS === "web" && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleWebFileChange}
        />
      )}

      {/* Native picker modal */}
      <Modal transparent visible={showPicker} animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{isWardrobe ? "Add item" : "Save item"}</Text>
            <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={22} color="#1a1a1a" />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={pickFromGallery}>
              <Ionicons name="image-outline" size={22} color="#1a1a1a" />
              <Text style={styles.modalOptionText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowPicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Item Detail Modal ───────────────────────────────────────────────── */}
      <Modal
        transparent
        visible={showDetail}
        animationType="slide"
        onRequestClose={() => setShowDetail(false)}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailSheet}>
            {detailItem && (
              <>
                {/* Close button */}
                <TouchableOpacity style={styles.detailClose} onPress={() => setShowDetail(false)}>
                  <Ionicons name="close" size={20} color="#1a1a1a" />
                </TouchableOpacity>

                {/* Full image */}
                <View style={styles.detailImageWrap}>
                  <Image
                    source={{ uri: detailItem.image_url }}
                    style={styles.detailImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Name */}
                <Text style={styles.detailName}>{getItemName(detailItem)}</Text>

                {/* Tags */}
                {detailItem.tags.length > 0 ? (
                  <View style={styles.detailTagsWrap}>
                    {detailItem.tags.map((tag, i) => {
                      const colour = TAG_COLORS[i % TAG_COLORS.length];
                      return (
                        <View key={i} style={[styles.detailTag, { backgroundColor: colour.bg }]}>
                          <Text style={[styles.detailTagText, { color: colour.text }]}>{tag}</Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.detailNoTags}>No tags yet</Text>
                )}

                {/* Delete button */}
                <TouchableOpacity
                  style={styles.detailDeleteBtn}
                  onPress={() => confirmRemove(detailItem.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  <Text style={styles.detailDeleteText}>Remove item</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => setShowTokens(true)}>
          <Ionicons name="person-outline" size={20} color="#555" />
        </TouchableOpacity>
        <View style={styles.logoWrapper}>
          <Image
            source={require("../../assets/images/logo.png")}
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
          <Text style={styles.title}>
            {isWardrobe ? "Your\nwardrobe" : "Saved\npieces"}
          </Text>
          <View style={styles.titleButtons}>
            <TouchableOpacity
              style={[styles.outlineButton, !isWardrobe && styles.outlineButtonActive]}
              onPress={() => { setView(isWardrobe ? "saved" : "wardrobe"); setSelectedCategory("All"); }}
            >
              <Feather name={isWardrobe ? "bookmark" : "shopping-bag"} size={15} color={isWardrobe ? "#1a1a1a" : "white"} />
              <Text style={[styles.outlineButtonText, !isWardrobe && styles.outlineButtonTextActive]}>
                {isWardrobe ? "Saved" : "Wardrobe"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.blackButton} onPress={handleAddItem} disabled={uploading}>
              {uploading
                ? <ActivityIndicator size="small" color="white" />
                : <Feather name="plus" size={15} color="white" />
              }
              <Text style={styles.blackButtonText}>
                {uploading ? "Processing..." : isWardrobe ? "Add item" : "Save item"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.subtitle}>
          {isWardrobe
            ? "All your clothing pieces, organised in one place."
            : "Pieces you saved from other clothing stores, use them to test outfits before you buy."}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
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

        {uploading && (
          <View style={styles.uploadingBanner}>
            <ActivityIndicator size="small" color="#1a1a1a" />
            <Text style={styles.uploadingText}>Removing background, cropping & tagging your item...</Text>
          </View>
        )}

        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name={isWardrobe ? "shopping-bag" : "bookmark"} size={28} color="#bbb" />
            </View>
            <Text style={styles.emptyTitle}>{isWardrobe ? "No items yet" : "Nothing saved yet"}</Text>
            <Text style={styles.emptySub}>
              {isWardrobe
                ? 'Tap "Add item" to start building your wardrobe.'
                : "Save pieces from online stores to try them in outfits before you buy."}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddItem} disabled={uploading}>
              <Feather name="plus" size={16} color="white" />
              <Text style={styles.emptyButtonText}>{isWardrobe ? "Add your first item" : "Save your first piece"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => openDetail(item)}
              >
                <Image source={{ uri: item.image_url }} style={styles.image} />
                {item.tags.length > 0 && (
                  <View style={styles.cardTag}>
                    <Text style={styles.cardTagText}>{item.tags[0]}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={(e) => { e.stopPropagation?.(); confirmRemove(item.id); }}
                >
                  <Ionicons name="trash-outline" size={12} color="#fff" />
                </TouchableOpacity>
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
  container:               { flex: 1, backgroundColor: "#F5F3F0" },
  blob1:                   { position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: "#F4C4C4", opacity: 0.35 },
  blob2:                   { position: "absolute", bottom: 100, left: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: "#D4C8F0", opacity: 0.35 },
  topBar:                  { marginTop: 58, marginBottom: 8, paddingHorizontal: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconCircle:              { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.75)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.06)" },
  logoWrapper:             { flexDirection: "row", alignItems: "center" },
  logoImage:               { width: 120, height: 40 },
  scrollContent:           { paddingHorizontal: 22, paddingBottom: 60 },
  titleRow:                { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 28 },
  title:                   { fontSize: 42, fontWeight: "800", color: "#1a1a1a", lineHeight: 48 },
  titleButtons:            { flexDirection: "column", gap: 8, marginBottom: 6 },
  outlineButton:           { flexDirection: "row", alignItems: "center", backgroundColor: "transparent", paddingHorizontal: 16, paddingVertical: 11, borderRadius: 30, borderWidth: 1.5, borderColor: "#1a1a1a", gap: 6, justifyContent: "center" },
  outlineButtonActive:     { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  outlineButtonText:       { color: "#1a1a1a", fontWeight: "700", fontSize: 14 },
  outlineButtonTextActive: { color: "white" },
  blackButton:             { flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a1a", paddingHorizontal: 18, paddingVertical: 13, borderRadius: 30, gap: 6, justifyContent: "center" },
  blackButtonText:         { color: "white", fontWeight: "700", fontSize: 14 },
  subtitle:                { marginTop: 10, color: "#888", fontSize: 14, lineHeight: 20 },
  filterScroll:            { marginTop: 22, flexGrow: 0 },
  filterRow:               { flexDirection: "row", gap: 8, paddingRight: 10 },
  filterButton:            { backgroundColor: "rgba(255,255,255,0.85)", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 30, borderWidth: 1, borderColor: "rgba(0,0,0,0.07)" },
  activeFilter:            { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  filterText:              { fontWeight: "600", color: "#444", fontSize: 14 },
  activeFilterText:        { color: "white" },
  uploadingBanner:         { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.9)", padding: 14, borderRadius: 16, marginTop: 16, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)" },
  uploadingText:           { fontSize: 13, color: "#555", flex: 1 },
  emptyState:              { alignItems: "center", marginTop: 50, paddingHorizontal: 20 },
  emptyIconWrap:           { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(255,255,255,0.9)", justifyContent: "center", alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)" },
  emptyTitle:              { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
  emptySub:                { fontSize: 14, color: "#999", textAlign: "center", lineHeight: 20, marginBottom: 28 },
  emptyButton:             { flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a1a", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, gap: 8 },
  emptyButtonText:         { color: "white", fontWeight: "700", fontSize: 15 },
  grid:                    { flexDirection: "row", flexWrap: "wrap", marginTop: 20, gap: 12 },
  card:                    { width: (width - 56) / 2, height: 210, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  image:                   { width: "100%", height: "100%" },
  cardTag:                 { position: "absolute", bottom: 10, left: 10, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  cardTagText:             { color: "white", fontSize: 11, fontWeight: "600" },
  deleteBtn:               { position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },

  // Picker modal
  modalOverlay:            { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet:              { backgroundColor: "white", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle:              { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 20, textAlign: "center" },
  modalOption:             { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  modalOptionText:         { fontSize: 16, color: "#1a1a1a", fontWeight: "500" },
  modalCancel:             { marginTop: 16, alignItems: "center", paddingVertical: 14 },
  modalCancelText:         { fontSize: 16, color: "#999", fontWeight: "600" },

  // Detail modal
  detailOverlay:           { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  detailSheet:             { backgroundColor: "#F5F3F0", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 48, minHeight: height * 0.75 },
  detailClose:             { alignSelf: "flex-end", width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.07)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  detailImageWrap:         { width: "100%", height: height * 0.42, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.9)", overflow: "hidden", marginBottom: 20 },
  detailImage:             { width: "100%", height: "100%" },
  detailName:              { fontSize: 24, fontWeight: "800", color: "#1a1a1a", marginBottom: 14 },
  detailTagsWrap:          { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 28 },
  detailTag:               { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  detailTagText:           { fontSize: 13, fontWeight: "700" },
  detailNoTags:            { fontSize: 14, color: "#aaa", marginBottom: 28 },
  detailDeleteBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 50, backgroundColor: "#FFE5E5" },
  detailDeleteText:        { fontSize: 14, fontWeight: "700", color: "#FF3B30" },
});
