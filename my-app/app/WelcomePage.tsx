import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ListRenderItem,
} from 'react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

type Slide = {
  id: string;
  images: any[];
  title: string;
};

const slides: Slide[] = [
  {
    id: '1',
    images: [
      require('../assets/images/FormalImage.jpg'),
      require('../assets/images/minimalistImage.jpg'),
      require('../assets/images/streetwearImage.jpg'),
    ],
    title: 'Mix, Match & Style Like a Pro',
  },
];

export default function WelcomePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.replace('/(tabs)/HomeScreen');
    }
  };

  const renderSlide: ListRenderItem<Slide> = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.imageRow}>
        <Image source={item.images[0]} style={styles.leftImage} />
        <View style={styles.rightColumn}>
          <Image source={item.images[1]} style={styles.rightTopImage} />
          <Image source={item.images[2]} style={styles.rightBottomImage} />
        </View>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/LoginScreen')}>
        <Text style={styles.loginText}>
          Already have an account? <Text style={styles.loginLink}>Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      ref={flatListRef}
      data={slides}
      keyExtractor={(item) => item.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      renderItem={renderSlide}
      onMomentumScrollEnd={(event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
      }}
    />
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
  },
  imageRow: {
    flexDirection: 'row',
    width: '90%',
    height: 400,
    marginBottom: 30,
  },
  leftImage: {
    flex: 1.5,
    borderRadius: 20,
    marginRight: 10,
  },
  rightColumn: {
    flex: 1,
    justifyContent: 'space-between',
  },
  rightTopImage: {
    flex: 1,
    borderRadius: 20,
    marginBottom: 10,
  },
  rightBottomImage: {
    flex: 1,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  loginText: {
    fontSize: 14,
    color: '#333',
  },
  loginLink: {
    color: '#FF5722',
    fontWeight: '700',
  },
});