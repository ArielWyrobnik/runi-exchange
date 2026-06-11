import { categoryNames as baseCategoryNames, type Language } from "./translations";

export const categoryNames: Record<Language, Record<string, string>> = {
  en: {
    ...baseCategoryNames.en,
  },
  he: {
    ...baseCategoryNames.he,
    "Tickets": "כרטיסים",
    "RUNI Tickets": "כרטיסי RUNI",
    "Dorm Accessories": "אביזרים למעונות",
  },
};
