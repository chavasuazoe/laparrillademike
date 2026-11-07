/* Small self-contained SVG icon system (no network requests or icon fonts). */
(function(global){'use strict';
const shapes={
 taco:'<path d="M3 15c0-6 4-10 9-10s9 4 9 10H3Z"/><path d="M4 17h16M6 12l2 2m3-5 2 4m3-4 2 4"/>',
 gringa:'<path d="M12 3a9 9 0 0 0-9 9h9V3Z"/><path d="M12 3a9 9 0 1 1-9 9h9V3Z"/><circle cx="16" cy="12" r="1"/><circle cx="12" cy="16" r="1"/>',
 burger:'<path d="M4 10a8 8 0 0 1 16 0H4Zm0 4h16M4 18h16M3 12h18"/><path d="M7 7h.01M11 6h.01M15 7h.01"/>',
 hotdog:'<path d="M5 17 17 5a3 3 0 0 1 4 4L9 21a3 3 0 0 1-4-4Z"/><path d="M8 17 17 8M6 13l2 2m8-7 2 2"/>',
 fries:'<path d="M4 11h16l-2 10H6L4 11ZM7 11 6 3m5 8V2m4 9 3-8"/>',
 drink:'<path d="M5 6h14l-2 15H7L5 6ZM4 3h16M13 6l4-4"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 bag:'<path d="M4 8h16l-1.5 13h-13L4 8Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>',
 list:'<path d="M9 6h12M9 12h12M9 18h12M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>'
};
function draw(name,className=''){
 const valid=String(className).replace(/[^a-z0-9_ -]/gi,'');
 return `<svg viewBox="0 0 24 24" class="ui-icon ${valid}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${shapes[name]||shapes.plus}</svg>`;
}
global.AppIcons=Object.freeze({draw});
})(window);
