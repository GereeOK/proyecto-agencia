const TARGET_LANGS = ["en", "fr", "pt", "it"];
const TRANSLATABLE = ["title", "description", "incluye"];

export const translateServicio = async (form) => {
  const calls = [];
  for (const lang of TARGET_LANGS) {
    for (const field of TRANSLATABLE) {
      const text = form[field];
      if (!text?.trim()) continue;
      calls.push({ lang, field, text });
    }
  }

  const results = {};
  await Promise.all(
    calls.map(async ({ lang, field, text }) => {
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=es|${lang}`;
        const res = await fetch(url);
        const data = await res.json();
        const translated = data.responseData?.translatedText;
        if (translated && translated !== text) {
          results[`${field}_${lang}`] = translated;
        }
      } catch {
        // silently skip — display will fallback to ES
      }
    })
  );

  return results;
};

export const getLang = (obj, field, lang) => {
  if (!obj) return "";
  const code = lang?.slice(0, 2);
  if (!code || code === "es") return obj[field] ?? "";
  return obj[`${field}_${code}`] || obj[field] || "";
};
