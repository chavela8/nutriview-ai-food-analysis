import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import en from './translations/en';
import es from './translations/es';
import fr from './translations/fr';
import de from './translations/de';
import it from './translations/it';
import pt from './translations/pt';
import ru from './translations/ru';
import zh from './translations/zh';

// Create i18n instance
const i18n = new I18n({
  en,
  es,
  fr,
  de,
  it,
  pt,
  ru,
  zh,
});

// Set the locale once at the beginning of your app.
i18n.locale = Localization.locale.split('-')[0];

// When a value is missing from a language it'll fallback to another language with the key present.
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;