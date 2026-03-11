import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/theme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, focused }: { name: IoniconsName; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? '#de3341' : '#8c7d70'}
      />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: (Platform.OS === 'ios' ? 64 : 62) + insets.bottom,
            paddingBottom: Math.max(insets.bottom, Spacing.sm),
          },
        ],
        tabBarActiveTintColor: '#de3341',
        tabBarInactiveTintColor: '#8c7d70',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'scan' : 'scan-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pokedex"
        options={{
          title: 'PocketDex',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'library' : 'library-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'map' : 'map-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff8ef',
    borderTopColor: '#d8cfbf',
    borderTopWidth: 1,
    paddingTop: Spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconActive: {
    backgroundColor: 'rgba(222,51,65,0.12)',
  },
});
