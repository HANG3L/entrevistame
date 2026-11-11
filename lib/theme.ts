// Preferencia de tema: "system" (sigue al sistema), "light" o "dark".
export const THEME_KEY = "theme";

/**
 * Se ejecuta en el <head> antes de pintar la página, para que no parpadee
 * el tema equivocado. También sigue los cambios de tema del sistema.
 */
export const themeScript = `(function(){try{var m=matchMedia('(prefers-color-scheme: dark)');function a(){var p=localStorage.getItem('${THEME_KEY}')||'system';document.documentElement.dataset.theme=p==='system'?(m.matches?'dark':'light'):p}a();m.addEventListener('change',a);window.__applyTheme=a}catch(e){}})();`;
