import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, ThemeType } from '@/utils/theme';

type ThemeContextType = {
  theme: ThemeType;
  toggleTheme: () => void;
  dark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  toggleTheme: () => {},
  dark: false,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [dark, setDark] = useState(colorScheme === 'dark');
  const [theme, setTheme] = useState<ThemeType>(dark ? darkTheme : lightTheme);

  useEffect(() => {
    setTheme(dark ? darkTheme : lightTheme);
  }, [dark]);

  useEffect(() => {
    setDark(colorScheme === 'dark');
  }, [colorScheme]);

  const toggleTheme = () => {
    setDark(!dark);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, dark }}>
      {children}
    </ThemeContext.Provider>
  );
};