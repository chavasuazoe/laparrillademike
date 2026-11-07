/* Shared, dependency-free utilities. */
(function (global) {
  'use strict';
  const escapeMap = Object.freeze({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'});
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => escapeMap[character]);
  const createId = () => global.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const peso = value => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2}).format(value);
  const shiftDay = (date = new Date()) => {
    const day = new Date(date);
    if (day.getHours() < 6) day.setDate(day.getDate() - 1);
    return [day.getFullYear(),String(day.getMonth()+1).padStart(2,'0'),String(day.getDate()).padStart(2,'0')].join('-');
  };
  global.AppCore = Object.freeze({escapeHtml,createId,peso,shiftDay});
})(window);
