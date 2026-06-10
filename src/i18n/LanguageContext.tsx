import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  translations,
  categoryNames,
  conditionNames,
  type Language,
  type TranslationKey,
} from "./translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  tCategory: (name: string) => string;
  tCondition: (name: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "runi-market-lang";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "he" ? "he" : "en";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Language) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  const t = useCallback((key: TranslationKey) => translations[lang][key], [lang]);
  const tCategory = useCallback((name: string) => categoryNames[lang][name] ?? name, [lang]);
  const tCondition = useCallback((name: string) => conditionNames[lang][name] ?? name, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tCategory, tCondition }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
