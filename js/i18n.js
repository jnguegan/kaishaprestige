// /js/i18n.js
// Improved, resilient i18n loader with:
// - EN fallback on fetch/parse errors
// - EN fallback for missing keys
// - optional HTML translations via data-i18n-html
// - supports both #langSelect and .lang-select
// - optional debug mode: window.I18N_DEBUG = true

(() => {
  const STORAGE_KEY = "kp_lang";
  const DEFAULT_LANG = "en";
  const SUPPORTED = ["en", "fr", "es"];

  // IMPORTANT:
  // Use an ABSOLUTE path so it works on /, /services, /how-it-works, /request, etc.
  // Relative paths like "locales/en.json" break when the page URL is not "/".
  const LOCALES_BASE = "/locales/";

  let cache = {}; // { lang: translations }
  let enCache = null;

  const isDebug = () => Boolean(window.I18N_DEBUG);

  function safeLog(...args) {
    if (isDebug()) console.log("[i18n]", ...args);
  }

  function safeWarn(...args) {
    if (isDebug()) console.warn("[i18n]", ...args);
  }

  function normalizeLang(lang) {
    const l = String(lang || "").toLowerCase().trim();
    // Accept 'en-GB', 'fr-FR' style inputs
    const base = l.split("-")[0];
    return SUPPORTED.includes(base) ? base : DEFAULT_LANG;
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
    return await res.json();
  }

  async function loadLang(lang) {
    const l = normalizeLang(lang);
    if (cache[l]) return cache[l];

    const url = `${LOCALES_BASE}${l}.json`;

    try {
      const data = await fetchJson(url);
      cache[l] = data;
      safeLog(`Loaded ${l} translations`);
      return data;
    } catch (err) {
      safeWarn(`Failed loading ${l}:`, err);
      return null;
    }
  }

  function getByPath(obj, path) {
    if (!obj || !path) return undefined;
    const parts = String(path).split(".").filter(Boolean);
    let cur = obj;
    for (const p of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
        cur = cur[p];
      } else {
        return undefined;
      }
    }
    return cur;
  }

  function setElText(el, value, allowHtml) {
    if (value === undefined || value === null) return;
    if (allowHtml) el.innerHTML = String(value);
    else el.textContent = String(value);
  }

  function applyTranslations(active, lang) {
    const textNodes = document.querySelectorAll("[data-i18n]");
    const htmlNodes = document.querySelectorAll("[data-i18n-html]");

    const apply = (el, key, allowHtml) => {
      const v = getByPath(active, key);

      if (v !== undefined) {
        setElText(el, v, allowHtml);
        return;
      }

      // fallback to EN
      const enV = getByPath(enCache, key);
      if (enV !== undefined) {
        setElText(el, enV, allowHtml);
        safeWarn(`Missing key in ${lang}, used EN: ${key}`);
        return;
      }

      // fallback to showing key (debug friendly)
      setElText(el, key, false);
      safeWarn(`Missing key in ${lang} and EN: ${key}`);
    };

    textNodes.forEach(el => apply(el, el.getAttribute("data-i18n"), false));
    htmlNodes.forEach(el => apply(el, el.getAttribute("data-i18n-html"), true));

    // Optional: set <html lang="..">
    document.documentElement.setAttribute("lang", lang);
  }

  function getSelectEl() {
    return document.getElementById("langSelect") || document.querySelector(".lang-select");
  }

  function getSavedLang() {
    return normalizeLang(localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG);
  }

  function saveLang(lang) {
    localStorage.setItem(STORAGE_KEY, normalizeLang(lang));
  }

  async function setLanguage(lang) {
    const l = normalizeLang(lang);
    saveLang(l);

    // Ensure EN is loaded as a fallback
    if (!enCache) {
      enCache = (await loadLang("en")) || {};
    }

    const active = (await loadLang(l)) || enCache;
    applyTranslations(active, l);

    const sel = getSelectEl();
    if (sel && sel.value !== l) sel.value = l;

    safeLog(`Language set to ${l}`);
  }

  function bindSelect() {
    const sel = getSelectEl();
    if (!sel) return;

    // Ensure options are present (if user used a custom select)
    if (sel.tagName === "SELECT" && sel.options && sel.options.length === 0) {
      SUPPORTED.forEach(code => {
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = code.toUpperCase();
        sel.appendChild(opt);
      });
    }

    sel.addEventListener("change", (e) => setLanguage(e.target.value));
  }

  document.addEventListener("DOMContentLoaded", async () => {
    bindSelect();

    // If no saved language, try browser language first
    const browserLang = normalizeLang(navigator.language || navigator.userLanguage || DEFAULT_LANG);
    const initial = localStorage.getItem(STORAGE_KEY)
      ? getSavedLang()
      : browserLang;

    await setLanguage(initial);
  });

  // Expose for debugging/manual switching in console: i18nSetLang('fr')
  window.i18nSetLang = setLanguage;
})();
