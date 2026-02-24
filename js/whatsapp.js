/* /js/whatsapp.js
   Unified header WhatsApp template for all pages
*/

(function () {

  const WA_NUMBER = "33781987928";

  function getLang() {
    const sel = document.getElementById("langSelect");
    const stored =
      localStorage.getItem("kp_lang") ||
      localStorage.getItem("pap_lang") ||
      localStorage.getItem("ks_lang") ||
      localStorage.getItem("lang");

    const raw = (sel && sel.value) || stored || "en";
    return String(raw).toLowerCase().split("-")[0];
  }

  function buildMessage(lang) {

    if (lang === "fr") {
      return `Bonjour KS Group Concierge,

Je souhaite organiser une assistance concierge.

• Service :
• Lieu(x) :
• Date(s) & heure :
• Nombre de personnes :
• Exigences complémentaires :

Merci de confirmer la disponibilité et les prochaines étapes.

Cordialement.`;
    }

    if (lang === "es") {
      return `Hola KS Group Concierge,

Me gustaría organizar asistencia de concierge.

• Servicio:
• Ubicación(es):
• Fecha(s) y hora:
• Personas:
• Requisitos adicionales:

Por favor, confirme disponibilidad y próximos pasos.

Gracias.`;
    }

    // English default
    return `Hello KS Group Concierge,

I would like to arrange concierge support.

• Service:
• Location(s):
• Date(s) & time:
• Guests:
• Additional requirements:

Please confirm availability and next steps.

Thank you.`;
  }

  function openWhatsApp(message) {
    const url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message);
    window.open(url, "_blank", "noopener");
  }

  document.addEventListener("DOMContentLoaded", function () {

    const buttons = document.querySelectorAll("[data-wa='header']");
    if (!buttons.length) return;

    buttons.forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const lang = getLang();
        const msg = buildMessage(lang);
        openWhatsApp(msg);
      });
    });

  });

})();
