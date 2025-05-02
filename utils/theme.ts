export type ThemeType = {
  dark: boolean;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    tertiary: string;
    tertiaryLight: string;
    accent: string;
    accentLight: string;
    success: string;
    warning: string;
    danger: string;
    background: string;
    card: string;
    cardSecondary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    dangerLight?: string;
    warningLight?: string;
    successLight?: string;
  };
  name: string;
  id: string;
};

export type ThemeOption = {
  id: string;
  name: string;
  dark: boolean;
  colors: {
    primary: string;
    secondary: string;
  };
};

// Default light theme (Mint & Coral)
export const lightTheme: ThemeType = {
  dark: false,
  name: "Mint & Coral",
  id: "mint-coral-light",
  colors: {
    primary: '#66D4B0', // Mint
    primaryLight: 'rgba(102, 212, 176, 0.15)',
    primaryDark: '#4FB798',
    secondary: '#FF9A8B', // Coral
    secondaryLight: 'rgba(255, 154, 139, 0.15)',
    secondaryDark: '#E8756A',
    tertiary: '#B388EB', // Purple
    tertiaryLight: 'rgba(179, 136, 235, 0.15)',
    accent: '#FEC89A', // Peach
    accentLight: 'rgba(254, 200, 154, 0.15)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#F7F9FC',
    card: '#FFFFFF',
    cardSecondary: '#F2F5F9',
    text: '#2D3748',
    textSecondary: '#718096',
    textTertiary: '#A0AEC0',
    border: '#E2E8F0',
    dangerLight: 'rgba(239, 111, 108, 0.15)',
    warningLight: 'rgba(255, 204, 128, 0.15)',
    successLight: 'rgba(118, 200, 147, 0.15)',
  }
};

// Default dark theme (Mint & Coral Dark)
export const darkTheme: ThemeType = {
  dark: true,
  name: "Mint & Coral Dark",
  id: "mint-coral-dark",
  colors: {
    primary: '#66D4B0', // Mint
    primaryLight: 'rgba(102, 212, 176, 0.2)',
    primaryDark: '#4FB798',
    secondary: '#FF9A8B', // Coral
    secondaryLight: 'rgba(255, 154, 139, 0.2)',
    secondaryDark: '#E8756A',
    tertiary: '#B388EB', // Purple
    tertiaryLight: 'rgba(179, 136, 235, 0.2)',
    accent: '#FEC89A', // Peach
    accentLight: 'rgba(254, 200, 154, 0.2)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#1A202C',
    card: '#2D3748',
    cardSecondary: '#364154',
    text: '#F7FAFC',
    textSecondary: '#CBD5E0',
    textTertiary: '#718096',
    border: '#4A5568',
    dangerLight: 'rgba(239, 111, 108, 0.25)',
    warningLight: 'rgba(255, 204, 128, 0.25)',
    successLight: 'rgba(118, 200, 147, 0.25)',
  }
};

// Additional Light Themes
export const lavenderBlushLight: ThemeType = {
  dark: false,
  name: "Lavender & Blush",
  id: "lavender-blush-light",
  colors: {
    primary: '#B8A5E3', // Lavender
    primaryLight: 'rgba(184, 165, 227, 0.15)',
    primaryDark: '#9B87CA',
    secondary: '#FFA0A0', // Blush Pink
    secondaryLight: 'rgba(255, 160, 160, 0.15)',
    secondaryDark: '#E38787',
    tertiary: '#86B6F6', // Light Blue
    tertiaryLight: 'rgba(134, 182, 246, 0.15)',
    accent: '#FFD1BA', // Light Peach
    accentLight: 'rgba(255, 209, 186, 0.15)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#F8F6FC',
    card: '#FFFFFF',
    cardSecondary: '#F3F0FC',
    text: '#2D3748',
    textSecondary: '#718096',
    textTertiary: '#A0AEC0',
    border: '#E5E0F5',
    dangerLight: 'rgba(239, 111, 108, 0.15)',
    warningLight: 'rgba(255, 204, 128, 0.15)',
    successLight: 'rgba(118, 200, 147, 0.15)',
  }
};

export const oceanBreezeLight: ThemeType = {
  dark: false,
  name: "Ocean Breeze",
  id: "ocean-breeze-light",
  colors: {
    primary: '#8FD1E7', // Sky Blue
    primaryLight: 'rgba(143, 209, 231, 0.15)',
    primaryDark: '#6BB1CC',
    secondary: '#B9E6D3', // Mint Green
    secondaryLight: 'rgba(185, 230, 211, 0.15)',
    secondaryDark: '#93C6B3',
    tertiary: '#FFAECF', // Pink
    tertiaryLight: 'rgba(255, 174, 207, 0.15)',
    accent: '#F7F3A6', // Pale Yellow
    accentLight: 'rgba(247, 243, 166, 0.15)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#F5FAFE',
    card: '#FFFFFF',
    cardSecondary: '#F0F7FC',
    text: '#2D3748',
    textSecondary: '#718096',
    textTertiary: '#A0AEC0',
    border: '#E1EDF5',
    dangerLight: 'rgba(239, 111, 108, 0.15)',
    warningLight: 'rgba(255, 204, 128, 0.15)',
    successLight: 'rgba(118, 200, 147, 0.15)',
  }
};

export const peachyKeenLight: ThemeType = {
  dark: false,
  name: "Peachy Keen",
  id: "peachy-keen-light",
  colors: {
    primary: '#FFB6A3', // Peach
    primaryLight: 'rgba(255, 182, 163, 0.15)',
    primaryDark: '#E89B8C',
    secondary: '#B9E6D3', // Mint Green
    secondaryLight: 'rgba(185, 230, 211, 0.15)',
    secondaryDark: '#93C6B3',
    tertiary: '#FFC6DC', // Pink
    tertiaryLight: 'rgba(255, 198, 220, 0.15)',
    accent: '#FFF0A8', // Light Yellow
    accentLight: 'rgba(255, 240, 168, 0.15)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#FEF8F6',
    card: '#FFFFFF',
    cardSecondary: '#FDF4F0',
    text: '#2D3748',
    textSecondary: '#718096',
    textTertiary: '#A0AEC0',
    border: '#F5E8E5',
    dangerLight: 'rgba(239, 111, 108, 0.15)',
    warningLight: 'rgba(255, 204, 128, 0.15)',
    successLight: 'rgba(118, 200, 147, 0.15)',
  }
};

export const roseGoldLight: ThemeType = {
  dark: false,
  name: "Rose Gold",
  id: "rose-gold-light",
  colors: {
    primary: '#E8B4BC', // Rose
    primaryLight: 'rgba(232, 180, 188, 0.15)',
    primaryDark: '#C498A0',
    secondary: '#D4AF89', // Gold
    secondaryLight: 'rgba(212, 175, 137, 0.15)',
    secondaryDark: '#B69473',
    tertiary: '#A8D0DB', // Light Blue
    tertiaryLight: 'rgba(168, 208, 219, 0.15)',
    accent: '#C7CEEA', // Lavender
    accentLight: 'rgba(199, 206, 234, 0.15)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#FBF5F6',
    card: '#FFFFFF',
    cardSecondary: '#F8F0F2',
    text: '#2D3748',
    textSecondary: '#718096',
    textTertiary: '#A0AEC0',
    border: '#F1E5E7',
    dangerLight: 'rgba(239, 111, 108, 0.15)',
    warningLight: 'rgba(255, 204, 128, 0.15)',
    successLight: 'rgba(118, 200, 147, 0.15)',
  }
};

export const blueberryLimeLight: ThemeType = {
  dark: false,
  name: "Blueberry Lime",
  id: "blueberry-lime-light",
  colors: {
    primary: '#9DB0D2', // Blueberry
    primaryLight: 'rgba(157, 176, 210, 0.15)',
    primaryDark: '#8194B3',
    secondary: '#C3E59C', // Lime
    secondaryLight: 'rgba(195, 229, 156, 0.15)',
    secondaryDark: '#A3C27F',
    tertiary: '#F2B7C6', // Pink
    tertiaryLight: 'rgba(242, 183, 198, 0.15)',
    accent: '#FFEAAE', // Light Yellow
    accentLight: 'rgba(255, 234, 174, 0.15)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#F6F8FC',
    card: '#FFFFFF',
    cardSecondary: '#F1F4FA',
    text: '#2D3748',
    textSecondary: '#718096',
    textTertiary: '#A0AEC0',
    border: '#E5E9F2',
    dangerLight: 'rgba(239, 111, 108, 0.15)',
    warningLight: 'rgba(255, 204, 128, 0.15)',
    successLight: 'rgba(118, 200, 147, 0.15)',
  }
};

export const cottonCandyLight: ThemeType = {
  dark: false,
  name: "Cotton Candy",
  id: "cotton-candy-light",
  colors: {
    primary: '#FFAFD1', // Pink
    primaryLight: 'rgba(255, 175, 209, 0.15)',
    primaryDark: '#E493B3',
    secondary: '#97D2FB', // Blue
    secondaryLight: 'rgba(151, 210, 251, 0.15)',
    secondaryDark: '#7BB6DB',
    tertiary: '#C5A3FF', // Purple
    tertiaryLight: 'rgba(197, 163, 255, 0.15)',
    accent: '#FFDDA1', // Peach
    accentLight: 'rgba(255, 221, 161, 0.15)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#FEF6FA',
    card: '#FFFFFF',
    cardSecondary: '#FDF0F7',
    text: '#2D3748',
    textSecondary: '#718096',
    textTertiary: '#A0AEC0',
    border: '#F8E6F0',
    dangerLight: 'rgba(239, 111, 108, 0.15)',
    warningLight: 'rgba(255, 204, 128, 0.15)',
    successLight: 'rgba(118, 200, 147, 0.15)',
  }
};

export const keyLimeLight: ThemeType = {
  dark: false,
  name: "Key Lime",
  id: "key-lime-light",
  colors: {
    primary: '#BADC9B', // Lime
    primaryLight: 'rgba(186, 220, 155, 0.15)',
    primaryDark: '#9EBD82',
    secondary: '#FFC3A0', // Peach
    secondaryLight: 'rgba(255, 195, 160, 0.15)',
    secondaryDark: '#E5A989',
    tertiary: '#A6E4F0', // Light Blue
    tertiaryLight: 'rgba(166, 228, 240, 0.15)',
    accent: '#F6E3AB', // Light Yellow
    accentLight: 'rgba(246, 227, 171, 0.15)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#F7FBF4',
    card: '#FFFFFF',
    cardSecondary: '#F2F8ED',
    text: '#2D3748',
    textSecondary: '#718096',
    textTertiary: '#A0AEC0',
    border: '#E7EFE2',
    dangerLight: 'rgba(239, 111, 108, 0.15)',
    warningLight: 'rgba(255, 204, 128, 0.15)',
    successLight: 'rgba(118, 200, 147, 0.15)',
  }
};

export const lilacHazeLight: ThemeType = {
  dark: false,
  name: "Lilac Haze",
  id: "lilac-haze-light",
  colors: {
    primary: '#C8BCED', // Lilac
    primaryLight: 'rgba(200, 188, 237, 0.15)',
    primaryDark: '#AB9FCD',
    secondary: '#FFCBC8', // Light Coral
    secondaryLight: 'rgba(255, 203, 200, 0.15)',
    secondaryDark: '#E5B3B0',
    tertiary: '#A3D9D1', // Teal
    tertiaryLight: 'rgba(163, 217, 209, 0.15)',
    accent: '#FFE6B1', // Pale Yellow
    accentLight: 'rgba(255, 230, 177, 0.15)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#F9F7FD',
    card: '#FFFFFF',
    cardSecondary: '#F5F2FB',
    text: '#2D3748',
    textSecondary: '#718096',
    textTertiary: '#A0AEC0',
    border: '#EAE6F5',
    dangerLight: 'rgba(239, 111, 108, 0.15)',
    warningLight: 'rgba(255, 204, 128, 0.15)',
    successLight: 'rgba(118, 200, 147, 0.15)',
  }
};

export const tropicalSunsetLight: ThemeType = {
  dark: false,
  name: "Tropical Sunset",
  id: "tropical-sunset-light",
  colors: {
    primary: '#FFA07A', // Light Salmon
    primaryLight: 'rgba(255, 160, 122, 0.15)',
    primaryDark: '#E58968',
    secondary: '#87CEEB', // Sky Blue
    secondaryLight: 'rgba(135, 206, 235, 0.15)',
    secondaryDark: '#6EB0CB',
    tertiary: '#FFD700', // Gold
    tertiaryLight: 'rgba(255, 215, 0, 0.15)',
    accent: '#98FB98', // Pale Green
    accentLight: 'rgba(152, 251, 152, 0.15)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#FDF8F5',
    card: '#FFFFFF',
    cardSecondary: '#FCF3EF',
    text: '#2D3748',
    textSecondary: '#718096',
    textTertiary: '#A0AEC0',
    border: '#F3E8E4',
    dangerLight: 'rgba(239, 111, 108, 0.15)',
    warningLight: 'rgba(255, 204, 128, 0.15)',
    successLight: 'rgba(118, 200, 147, 0.15)',
  }
};

export const matcha: ThemeType = {
  dark: false,
  name: "Matcha Latte",
  id: "matcha-latte-light",
  colors: {
    primary: '#9BC492', // Matcha
    primaryLight: 'rgba(155, 196, 146, 0.15)',
    primaryDark: '#83A87B',
    secondary: '#F1CDB0', // Latte
    secondaryLight: 'rgba(241, 205, 176, 0.15)',
    secondaryDark: '#D7B59A',
    tertiary: '#B8D9B5', // Light Green
    tertiaryLight: 'rgba(184, 217, 181, 0.15)',
    accent: '#FFF2CC', // Cream
    accentLight: 'rgba(255, 242, 204, 0.15)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#F8FCF7',
    card: '#FFFFFF',
    cardSecondary: '#F3F9F2',
    text: '#2D3748',
    textSecondary: '#718096',
    textTertiary: '#A0AEC0',
    border: '#E9F0E7',
    dangerLight: 'rgba(239, 111, 108, 0.15)',
    warningLight: 'rgba(255, 204, 128, 0.15)',
    successLight: 'rgba(118, 200, 147, 0.15)',
  }
};

// Additional Dark Themes
export const lavenderBlushDark: ThemeType = {
  dark: true,
  name: "Lavender & Blush Dark",
  id: "lavender-blush-dark",
  colors: {
    primary: '#B8A5E3', // Lavender
    primaryLight: 'rgba(184, 165, 227, 0.2)',
    primaryDark: '#9B87CA',
    secondary: '#FFA0A0', // Blush Pink
    secondaryLight: 'rgba(255, 160, 160, 0.2)',
    secondaryDark: '#E38787',
    tertiary: '#86B6F6', // Light Blue
    tertiaryLight: 'rgba(134, 182, 246, 0.2)',
    accent: '#FFD1BA', // Light Peach
    accentLight: 'rgba(255, 209, 186, 0.2)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#1A1625',
    card: '#2B2235',
    cardSecondary: '#352A42',
    text: '#F7FAFC',
    textSecondary: '#CBD5E0',
    textTertiary: '#718096',
    border: '#3D324D',
    dangerLight: 'rgba(239, 111, 108, 0.25)',
    warningLight: 'rgba(255, 204, 128, 0.25)',
    successLight: 'rgba(118, 200, 147, 0.25)',
  }
};

export const oceanBreezeDark: ThemeType = {
  dark: true,
  name: "Ocean Breeze Dark",
  id: "ocean-breeze-dark",
  colors: {
    primary: '#8FD1E7', // Sky Blue
    primaryLight: 'rgba(143, 209, 231, 0.2)',
    primaryDark: '#6BB1CC',
    secondary: '#B9E6D3', // Mint Green
    secondaryLight: 'rgba(185, 230, 211, 0.2)',
    secondaryDark: '#93C6B3',
    tertiary: '#FFAECF', // Pink
    tertiaryLight: 'rgba(255, 174, 207, 0.2)',
    accent: '#F7F3A6', // Pale Yellow
    accentLight: 'rgba(247, 243, 166, 0.2)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#102A39',
    card: '#1E3A49',
    cardSecondary: '#29495A',
    text: '#F7FAFC',
    textSecondary: '#CBD5E0',
    textTertiary: '#718096',
    border: '#34556A',
    dangerLight: 'rgba(239, 111, 108, 0.25)',
    warningLight: 'rgba(255, 204, 128, 0.25)',
    successLight: 'rgba(118, 200, 147, 0.25)',
  }
};

export const peachyKeenDark: ThemeType = {
  dark: true,
  name: "Peachy Keen Dark",
  id: "peachy-keen-dark",
  colors: {
    primary: '#FFB6A3', // Peach
    primaryLight: 'rgba(255, 182, 163, 0.2)',
    primaryDark: '#E89B8C',
    secondary: '#B9E6D3', // Mint Green
    secondaryLight: 'rgba(185, 230, 211, 0.2)',
    secondaryDark: '#93C6B3',
    tertiary: '#FFC6DC', // Pink
    tertiaryLight: 'rgba(255, 198, 220, 0.2)',
    accent: '#FFF0A8', // Light Yellow
    accentLight: 'rgba(255, 240, 168, 0.2)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#2C2017',
    card: '#3C2E23',
    cardSecondary: '#483A2E',
    text: '#F7FAFC',
    textSecondary: '#CBD5E0',
    textTertiary: '#718096',
    border: '#5A4A3B',
    dangerLight: 'rgba(239, 111, 108, 0.25)',
    warningLight: 'rgba(255, 204, 128, 0.25)',
    successLight: 'rgba(118, 200, 147, 0.25)',
  }
};

export const cottonCandyDark: ThemeType = {
  dark: true,
  name: "Cotton Candy Dark",
  id: "cotton-candy-dark",
  colors: {
    primary: '#FFAFD1', // Pink
    primaryLight: 'rgba(255, 175, 209, 0.2)',
    primaryDark: '#E493B3',
    secondary: '#97D2FB', // Blue
    secondaryLight: 'rgba(151, 210, 251, 0.2)',
    secondaryDark: '#7BB6DB',
    tertiary: '#C5A3FF', // Purple
    tertiaryLight: 'rgba(197, 163, 255, 0.2)',
    accent: '#FFDDA1', // Peach
    accentLight: 'rgba(255, 221, 161, 0.2)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#291E24',
    card: '#392931',
    cardSecondary: '#44333D',
    text: '#F7FAFC',
    textSecondary: '#CBD5E0',
    textTertiary: '#718096',
    border: '#573E4E',
    dangerLight: 'rgba(239, 111, 108, 0.25)',
    warningLight: 'rgba(255, 204, 128, 0.25)',
    successLight: 'rgba(118, 200, 147, 0.25)',
  }
};

export const midnightPurple: ThemeType = {
  dark: true,
  name: "Midnight Purple",
  id: "midnight-purple-dark",
  colors: {
    primary: '#B19CD9', // Light Purple
    primaryLight: 'rgba(177, 156, 217, 0.2)',
    primaryDark: '#9583BB',
    secondary: '#F6C3E5', // Pink
    secondaryLight: 'rgba(246, 195, 229, 0.2)',
    secondaryDark: '#D6A7C6',
    tertiary: '#89CFF0', // Baby Blue
    tertiaryLight: 'rgba(137, 207, 240, 0.2)',
    accent: '#FFD700', // Gold
    accentLight: 'rgba(255, 215, 0, 0.2)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#1C1630',
    card: '#2B2145',
    cardSecondary: '#362B54',
    text: '#F7FAFC',
    textSecondary: '#CBD5E0',
    textTertiary: '#718096',
    border: '#413267',
    dangerLight: 'rgba(239, 111, 108, 0.25)',
    warningLight: 'rgba(255, 204, 128, 0.25)',
    successLight: 'rgba(118, 200, 147, 0.25)',
  }
};

export const matchaDark: ThemeType = {
  dark: true,
  name: "Matcha Latte Dark",
  id: "matcha-latte-dark",
  colors: {
    primary: '#9BC492', // Matcha
    primaryLight: 'rgba(155, 196, 146, 0.2)',
    primaryDark: '#83A87B',
    secondary: '#F1CDB0', // Latte
    secondaryLight: 'rgba(241, 205, 176, 0.2)',
    secondaryDark: '#D7B59A',
    tertiary: '#B8D9B5', // Light Green
    tertiaryLight: 'rgba(184, 217, 181, 0.2)',
    accent: '#FFF2CC', // Cream
    accentLight: 'rgba(255, 242, 204, 0.2)',
    success: '#76C893',
    warning: '#FFCC80',
    danger: '#EF6F6C',
    background: '#1A2A1F',
    card: '#263830',
    cardSecondary: '#30463A',
    text: '#F7FAFC',
    textSecondary: '#CBD5E0',
    textTertiary: '#718096',
    border: '#3A5245',
    dangerLight: 'rgba(239, 111, 108, 0.25)',
    warningLight: 'rgba(255, 204, 128, 0.25)',
    successLight: 'rgba(118, 200, 147, 0.25)',
  }
};

// All available themes
export const allThemes: ThemeType[] = [
  lightTheme,
  darkTheme,
  lavenderBlushLight,
  lavenderBlushDark,
  oceanBreezeLight,
  oceanBreezeDark,
  peachyKeenLight,
  peachyKeenDark,
  roseGoldLight,
  blueberryLimeLight,
  cottonCandyLight,
  cottonCandyDark,
  keyLimeLight,
  lilacHazeLight,
  tropicalSunsetLight,
  matcha,
  midnightPurple,
  matchaDark
];

// Generate theme options for selection
export const themeOptions: ThemeOption[] = allThemes.map(theme => ({
  id: theme.id,
  name: theme.name,
  dark: theme.dark,
  colors: {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary
  }
}));

// Function to get theme by ID
export const getThemeById = (id: string): ThemeType => {
  // Using Array.prototype.find with explicit type for the callback parameter
  const theme = allThemes.find((theme: ThemeType) => theme.id === id);
  // Using type assertion for string method
  return theme || (id.includes ? (id as string).includes('dark') ? darkTheme : lightTheme : lightTheme);
};