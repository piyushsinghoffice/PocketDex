import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  ServerSetup: undefined;
  MainTabs: undefined;
  AnimalDetail: { id: string };
  DiscoveryResult: { id: string };
};

export type MainTabParamList = {
  Home: undefined;
  Scan: undefined;
  Pokedex: undefined;
  Explore: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;
