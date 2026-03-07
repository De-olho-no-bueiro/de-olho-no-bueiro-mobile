/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#33CCFF'; // Cyan característico do Waze
const tintColorDark = '#33CCFF';

export const Colors = {
  light: {
    text: '#222222', // Texto quase preto para alto contraste
    background: '#F2F4F5', // Cinza muito claro, Off-white (estilo Waze background)
    surface: '#FFFFFF', // Cartões e modais brancos
    border: '#E8EAED', // Bordas sutis
    tint: tintColorLight,
    icon: '#5F6368', // Ícones num cinza acessível
    tabIconDefault: '#80868B',
    tabIconSelected: tintColorLight,
    error: '#FF5252',
    warning: '#FFC107',
  },
  dark: {
    text: '#E5E7EB',
    background: '#121212', // Waze dark mode background (modo noturno)
    surface: '#1F2023', // Cartões em tom levemente mais claro
    border: '#3A3B3E',
    tint: tintColorDark,
    icon: '#9AA0A6',
    tabIconDefault: '#7D8287',
    tabIconSelected: tintColorDark,
    error: '#FF5252',
    warning: '#FFC107',
  },
};

/**
 * Constantes de layout do Waze aesthetic (tudo bastante redondo e flutuante)
 */
export const Layout = {
  borderRadius: {
    small: 8,
    medium: 16, // Cartões normais
    large: 24, // Painéis de baixo e modais
    pill: 999, // Botões e inputs (famoso pill-shape)
  },
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
    android: {
      elevation: 6,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
  }),
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
