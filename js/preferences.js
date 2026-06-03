import { storage } from './storage.js';

export function saveFilters(app) {
	storage.set("filters", JSON.stringify(app.state.filters));
}

export function saveComparisonSet(app) {
	storage.set(
		"comparisonSet",
		JSON.stringify(Array.from(app.state.comparisonSet)),
	);
}

export function restoreOsOrder(app) {
	const raw = storage.get("osOrder", null);
	if (!raw) return;
	let savedOrder;
	try {
		savedOrder = JSON.parse(raw);
	} catch {
		return;
	}
	if (
		!savedOrder ||
		!Array.isArray(savedOrder) ||
		!app.state.fontData
	)
		return;

	const map = {};
	app.state.fontData.operatingSystems.forEach((os) => {
		map[os.name] = os;
	});
	const reordered = savedOrder
		.map((name) => map[name])
		.filter(Boolean);
	const remaining = app.state.fontData.operatingSystems.filter(
		(os) => !savedOrder.includes(os.name),
	);
	app.state.fontData.operatingSystems =
		reordered.concat(remaining);
}
