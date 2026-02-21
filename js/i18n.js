const STORAGE_KEY = "kp_lang";
const DEFAULT_LANG = "en";

async function loadTranslations(lang) {
  const response = await fetch(`locales/${lang}.json`);
  return response.json();
}

function applyTranslations(translations) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const keys = el.getAttribute("data-i18n").split(".");
    let value = translations;
    keys.forEach(k => value = value?.[k]);
    if (value) el.textContent = value;
  });
}

async function setLanguage(lang) {
  localStorage.setItem(STORAGE_KEY, lang);
  const translations = await loadTranslations(lang);
  applyTranslations(translations);
}

document.addEventListener("DOMContentLoaded", async () => {
  const savedLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  document.getElementById("langSelect").value = savedLang;
  await setLanguage(savedLang);

  document.getElementById("langSelect").addEventListener("change", e => {
    setLanguage(e.target.value);
  });
});
