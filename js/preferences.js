import { storage } from './storage.js';

export function saveFilters(app) {
  storage.set('filters', JSON.stringify(app.state.filters));
}

export function saveComparisonSet(app) {
  storage.set('comparisonSet', JSON.stringify(Array.from(app.state.comparisonSet)));
}

export function reorderOperatingSystems(operatingSystems, order) {
  const map = {};
  operatingSystems.forEach((os) => {
    map[os.name] = os;
  });
  const reordered = order.map((name) => map[name]).filter(Boolean);
  const remaining = operatingSystems.filter((os) => !order.includes(os.name));
  return reordered.concat(remaining);
}

export function restoreOsOrder(app) {
  const raw = storage.get('osOrder', null);
  if (!raw) return;
  let savedOrder;
  try {
    savedOrder = JSON.parse(raw);
  } catch {
    return;
  }
  if (!savedOrder || !Array.isArray(savedOrder) || !app.state.fontData) return;

  app.state.fontData.operatingSystems = reorderOperatingSystems(app.state.fontData.operatingSystems, savedOrder);
}
