/* Single source of menu prices; legacy product IDs remain compatible. */
(function (global) {
  'use strict';
  const prices = Object.freeze({taco:40,cheese:10,gringa:75,volcanoPlain:45,volcanoMeat:70,
    burger:100,burgerSpecial:120,hotdog:50,hotdogSpecial:60,fries:70,wedgeFries:90,
    soda:35,freshSmall:25,freshLarge:40,waterSmall:20,waterLiter:30,beer:40,
    beerBottleSmall:70,beerBottleLarge:90});
  const row = (id,name,price,category,type='food') => Object.freeze({id,name,price,cat:category,type});
  const waiterProducts = [
    ...['Sirloin','Chuleta','Chorizo','Costilla','Arrachera','Campechanos'].map(name=>row(name.toLowerCase(),name,prices.taco,'tacos')),
    row('gringa','Gringa clásica',prices.gringa,'gringas'),
    row('volcan_nat','Volcán natural',prices.volcanoPlain,'gringas'),
    row('volcan_carne','Volcán con carne',prices.volcanoMeat,'gringas'),
    row('burger_mike','Hamburguesa Mike',prices.burger,'hamburguesas'),
    row('burger_esp','Hamburguesa especial',prices.burgerSpecial,'hamburguesas'),
    row('dog_mike','Hot dog Mike',prices.hotdog,'hotdogs'),
    row('dog_esp','Hot dog especial',prices.hotdogSpecial,'hotdogs'),
    row('papas','Papas fritas',prices.fries,'papas'),
    row('gajo','Papas gajo',prices.wedgeFries,'papas'),
    ...[['coca','Coca-Cola'],['yoli','Yoli'],['sprite','Sprite'],['manzanita','Manzanita'],['fresca','Fresca']].map(([id,name])=>row(id,name,prices.soda,'bebidas','drink')),
    ...[['jamaica_ch','Jamaica chica'],['horchata_ch','Horchata chica']].map(([id,name])=>row(id,name,prices.freshSmall,'bebidas','drink')),
    ...[['jamaica_gr','Jamaica grande'],['horchata_gr','Horchata grande']].map(([id,name])=>row(id,name,prices.freshLarge,'bebidas','drink')),
    row('agua_ch','Agua natural chica',prices.waterSmall,'bebidas','drink'),
    row('agua_lt','Agua natural 1 L',prices.waterLiter,'bebidas','drink'),
    row('victoria','Victoria',prices.beer,'bebidas','drink'),
    row('corona','Corona',prices.beer,'bebidas','drink'),
    row('caguama_ch','Caguama chica',prices.beerBottleSmall,'bebidas','drink'),
    row('caguama_gr','Caguama grande',prices.beerBottleLarge,'bebidas','drink')
  ];
  global.MenuCatalog=Object.freeze({prices,
    waiterProducts:Object.freeze(waiterProducts)});
})(window);
