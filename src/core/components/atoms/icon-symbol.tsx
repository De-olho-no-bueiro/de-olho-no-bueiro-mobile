// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconSymbolName = string;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: any = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left': 'chevron-left',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'mappin.and.ellipse': 'place',
  'location.fill': 'my-location',
  'camera.fill': 'photo-camera',
  'trash': 'delete',
  'trash.fill': 'delete',
  'cube': 'widgets',
  'square.and.arrow.up': 'share',
  'ellipsis': 'more-horiz',
  'gearshape.fill': 'settings',
  'person.crop.circle.fill': 'person',
  'map': 'map',
  'exclamationmark.triangle': 'warning',
  'exclamationmark.triangle.fill': 'warning',
  'clock': 'schedule',
  'water': 'water-drop',
  'manhole': 'electrical-services',
  'magnifyingglass': 'search',
  'xmark.circle.fill': 'cancel',
  'drop.fill': 'water-drop',
  'photo.fill': 'photo',
  'photo.on.rectangle': 'photo-library',
  globe: 'public',
  heart: 'favorite-border',
  'heart.fill': 'favorite',
  'bubble.right': 'chat-bubble-outline',
  'checkmark.seal': 'verified',
  checkmark: 'check',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name] ?? 'help-outline'} style={style} />;
}
