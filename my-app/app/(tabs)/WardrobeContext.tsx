import React, { createContext, useContext, useState } from "react";

type ClothingItem = {
  id: string;
  image: string;
  category: string;
  storeName?: string;
  saved: boolean;
};

type WardrobeContextType = {
  wardrobeItems: ClothingItem[];
  savedItems: ClothingItem[];
  addToWardrobe: (item: ClothingItem) => void;
  addToSaved: (item: ClothingItem) => void;
  removeFromWardrobe: (id: string) => void;
  removeFromSaved: (id: string) => void;
};

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [savedItems, setSavedItems] = useState<ClothingItem[]>([]);

  const addToWardrobe = (item: ClothingItem) => {
    setWardrobeItems((prev) => [...prev, item]);
  };

  const addToSaved = (item: ClothingItem) => {
    setSavedItems((prev) => [...prev, item]);
  };

  const removeFromWardrobe = (id: string) => {
    setWardrobeItems((prev) => prev.filter((i) => i.id !== id));
  };

  const removeFromSaved = (id: string) => {
    setSavedItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <WardrobeContext.Provider
      value={{
        wardrobeItems,
        savedItems,
        addToWardrobe,
        addToSaved,
        removeFromWardrobe,
        removeFromSaved,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  const context = useContext(WardrobeContext);
  if (!context) throw new Error("useWardrobe must be used within WardrobeProvider");
  return context;
}