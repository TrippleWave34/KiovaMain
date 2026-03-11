import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={styles.iconWrapper}>
      <Ionicons name={name} size={22} color={focused ? '#FFFFFF' : '#888888'} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="HomeScreen"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="Wardrobe"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name={focused ? 'shirt' : 'shirt-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="SavedOutfit"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name={focused ? 'heart' : 'heart-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}


const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 25,
    marginHorizontal: 20,
    left: 20,
    right: 20,
    height: 65,
    borderRadius: 35,

    backgroundColor: '#1A1A1A',
    borderTopWidth: 0,

    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  iconWrapper: {
    width: 35,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 23,
  },
});
