import { CONST, clamp, sizeForWeight, localToWorld, getLocalCoordsOnBeamAxis } from "./logic.js";

export function getEls() {
  const plankElement = document.getElementById("plank");
  const sceneElement = document.getElementById("scene");

  return {
    plankElement,
    sceneElement,
    placedLayer: plankElement.querySelector(".placed-layer"),

    ghostElement: document.getElementById("ghostWeight"),

    leftWeightValue: document.getElementById("leftWeightVal"),
    rightWeightValue: document.getElementById("rightWeightVal"),
    nextWeightValue: document.getElementById("nextWeightVal"),
    tiltAngleValue: document.getElementById("tiltAngleVal"),

    logBox: document.getElementById("logBox"),
    resetBtn: document.getElementById("resetBtn"),
  };
}

export function renderHUD(els, { left, right }, nextWeight, angleDegree) {
  els.leftWeightValue.textContent = `${left.toFixed(1)} kg`;
  els.rightWeightValue.textContent = `${right.toFixed(1)} kg`;
  els.nextWeightValue.textContent = `${nextWeight} kg`;
  els.tiltAngleValue.textContent = `${angleDegree.toFixed(1)}°`;
}

export function setPlankAngle(els, angleDegree) {
  els.plankElement.style.setProperty("--angle", `${angleDegree}deg`);
  els.tiltAngleValue.textContent = `${angleDegree.toFixed(1)}°`;
}

export function setGhostWeight(ghostElement, kg) {
  ghostElement.textContent = `${kg}kg`;
  const size = sizeForWeight(kg);
  ghostElement.style.width = `${size}px`;
  ghostElement.style.height = `${size}px`;
}

export function updateGhostFromPointer(els, nextWeight, angleDegree, clientX, clientY) {
  const { localX, pivotX, pivotY } = getLocalCoordsOnBeamAxis(clientX, clientY, els.plankElement, angleDegree);

  const half = CONST.PLANK_LENGTH_PX / 2;
  const size = sizeForWeight(nextWeight);
  const safeHalf = half - size / 2;
  const clampedLocalX = clamp(localX, -safeHalf, safeHalf);

  const { worldX, worldY } = localToWorld(pivotX, pivotY, clampedLocalX, 0, angleDegree);

  setGhostPosInScene(els, nextWeight, worldX, worldY);
}

function setGhostPosInScene(els, nextWeightKg, worldX, worldY) {
  const sceneRect = els.sceneElement.getBoundingClientRect();
  const size = sizeForWeight(nextWeightKg);

  let x = worldX - sceneRect.left;
  let y = worldY - sceneRect.top;

  y -= CONST.GHOST_VERTICAL_OFFSET_PX;

  const pad = size / 2 + 8;
  x = clamp(x, pad, sceneRect.width - pad);
  y = clamp(y, pad, sceneRect.height - pad);

  els.ghostElement.style.left = `${x}px`;
  els.ghostElement.style.top = `${y}px`;
}

export function renderPlaced(placedLayer, placed) {
  placedLayer.innerHTML = "";
  for (const item of placed) {
    placedLayer.appendChild(createPlacedBallEl(item.kg, item.x));
  }
}

function createPlacedBallEl(kg, x) {
  const el = document.createElement("div");
  el.className = "weight weight--placed";
  el.textContent = `${kg}kg`;

  const size = sizeForWeight(kg);
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;

  el.style.left = `calc(50% + ${Math.round(x)}px)`;
  el.style.top = `50%`;
  return el;
}

export function createDropEl(kg, x) {
  const el = document.createElement("div");
  el.className = "weight weight--drop";
  el.textContent = `${kg}kg`;

  const size = sizeForWeight(kg);
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;

  el.style.left = `calc(50% + ${Math.round(x)}px)`;
  el.style.top = `50%`;
  return el;
}

export function animateDropToPlaced(dropElement) {
  requestAnimationFrame(() => dropElement.classList.add("is-set"));
  dropElement.addEventListener(
    "transitionend",
    () => {
      dropElement.classList.remove("weight--drop", "is-set");
      dropElement.classList.add("weight--placed");
    },
    { once: true }
  );
}

export function renderLogs(logBox, logs) {
  logBox.innerHTML = "";

  if (!logs.length) {
    logBox.classList.add("is-empty");
    logBox.innerHTML = `<div class="item">${CONST.LOG_PLACEHOLDER_TEXT}</div>`;
    return;
  }

  logBox.classList.remove("is-empty");
  for (const line of logs) {
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = line;
    logBox.appendChild(div);
  }
}

export function saveState({ placed, nextWeight, logs }) {
  const state = {
    placed: placed.map((p) => ({ kg: p.kg, x: p.x })),
    nextWeight,
    logs: logs.slice(0, CONST.LOG_LIMIT),
  };
  try { localStorage.setItem(CONST.STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export function loadState() {
  try {
    const raw = localStorage.getItem(CONST.STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearState() {
  try { localStorage.removeItem(CONST.STORAGE_KEY); } catch {}
}

export function normalizeLoadedState(saved) {
  const placed = [];

  if (Array.isArray(saved?.placed)) {
    for (const p of saved.placed) {
      const kg = Number(p.kg);
      const x = Number(p.x);

      if (!Number.isFinite(kg) || !Number.isFinite(x)) continue;
      if (kg < CONST.WEIGHT_MIN_KG || kg > CONST.WEIGHT_MAX_KG) continue;

      const half = CONST.PLANK_LENGTH_PX / 2;
      const safeHalf = half - sizeForWeight(kg) / 2;
      const clampedX = clamp(x, -safeHalf, safeHalf);

      placed.push({ kg, x: clampedX });
    }
  }

  const nextWeight = (() => {
    const nw = Number(saved?.nextWeight);
    return Number.isFinite(nw) && nw >= CONST.WEIGHT_MIN_KG && nw <= CONST.WEIGHT_MAX_KG ? nw : null;
  })();

  const logs = Array.isArray(saved?.logs)
    ? saved.logs.filter((s) => typeof s === "string").slice(0, CONST.LOG_LIMIT)
    : [];

  return { placed, nextWeight, logs };
}