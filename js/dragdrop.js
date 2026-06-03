import { storage } from './storage.js';

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

export function onDrop(app, e) {
	e.preventDefault();
}

export function onDragEnd(app, e) {
	if (app.dragSrc) app.dragSrc.classList.remove("dragging");
	app.dragSrc = null;
	persistOrder(app);
}

export function persistOrder(app) {
	const domOrder = [
		...app.elements.content.querySelectorAll(".os-set"),
	].map((el) => el.dataset.osName);

	if (!app.state.fontData) return;
	const map = {};
	app.state.fontData.operatingSystems.forEach((os) => {
		map[os.name] = os;
	});
	const reordered = domOrder.map((name) => map[name]).filter(Boolean);
	const remaining = app.state.fontData.operatingSystems.filter(
		(os) => !domOrder.includes(os.name),
	);
	app.state.fontData.operatingSystems = reordered.concat(remaining);

	const finalOrder = app.state.fontData.operatingSystems.map(
		(os) => os.name,
	);
	storage.set("osOrder", JSON.stringify(finalOrder));
}
