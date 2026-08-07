import { reorderOperatingSystems } from "./preferences.js";
import { storage } from "./storage.js";

export function onDragStart(app, e) {
	const set = e.target.closest(".os-set");
	if (!set) return;
	app.dragSrc = set;
	set.classList.add("dragging");
	e.dataTransfer.effectAllowed = "move";
	e.dataTransfer.setData("text/plain", "");
}

export function onDragOver(app, e) {
	if (!app.dragSrc) return;
	e.preventDefault();
	const target = e.target.closest(".os-set");
	if (!target || target === app.dragSrc) return;
	const rect = target.getBoundingClientRect();
	const midY = rect.top + rect.height / 2;
	if (e.clientY < midY) {
		target.parentNode.insertBefore(app.dragSrc, target);
	} else {
		target.parentNode.insertBefore(app.dragSrc, target.nextSibling);
	}
}

export function onDrop(e) {
	// Prevent the browser default drop action (navigating to dropped data).
	e.preventDefault();
}

export function onDragEnd(app) {
	if (app.dragSrc) app.dragSrc.classList.remove("dragging");
	app.dragSrc = null;
	persistOrder(app);
}

export function persistOrder(app) {
	const domOrder = [...app.elements.content.querySelectorAll(".os-set")].map(
		(el) => el.dataset.osName
	);

	if (!app.state.fontData) return;
	app.state.fontData.operatingSystems = reorderOperatingSystems(
		app.state.fontData.operatingSystems,
		domOrder
	);

	const finalOrder = app.state.fontData.operatingSystems.map((os) => os.name);
	storage.set("osOrder", JSON.stringify(finalOrder));
}
