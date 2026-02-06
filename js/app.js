const sceneElement = document.getElementById("scene");
const plankElement = document.getElementById("plank");
const ghostElement = document.getElementById("ghostWeight");

const nextWeightValElement = document.getElementById("nextWeightVal");
const tiltAngleValElement = document.getElementById("tiltAngleVal");
const leftWeightValue = document.getElementById("leftWeightVal");
const rightWeightValue = document.getElementById("rightWeightVal");

const placedLayer = plankElement.querySelector(".placed-layer");

const resetBtn = document.getElementById("resetBtn");
const logBox = document.getElementById("logBox");

const PLANK_LENGTH = 600;
const GHOST_OFFSET_Y = 140;

const MAX_ANGLE = 30;
const TORQUE_DIVISOR = 30;
const FOLLOW_SPEED = 0.18;
const SNAP_EPS = 0.02;

const LOG_LIMIT = 30;
const LOG_PLACEHOLDER = "No drops yet";

const STORAGE_KEY = "seesaw_state_m6";

let currentAngleDeg = 0;
let targetAngleDeg = 0;

let nextWeightKg = randWeight();

let placed = [];

let logs = [];

let leftTotal = 0;
let rightTotal = 0;

function randWeight() {
  return Math.floor(Math.random() * 10) + 1;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function formatLogLine(kg, x) {
  const side = x < 0 ? "left" : "right";
  const dist = Math.round(Math.abs(x));
  return `${kg}kg dropped on ${side} side at ${dist}px from center`;
}

function getLocalOnPlankAxis(clientX, clientY, angleDeg) {
  const rect = plankElement.getBoundingClientRect();
  const pivotX = rect.left + rect.width / 2;
  const pivotY = rect.top + rect.height / 2;

  const dx = clientX - pivotX;
  const dy = clientY - pivotY;

  const a = degToRad(angleDeg);

  const localX = dx * Math.cos(a) + dy * Math.sin(a);
  const localY = -dx * Math.sin(a) + dy * Math.cos(a);

  return { localX, localY, pivotX, pivotY };
}

function localToWorld(pivotX, pivotY, localX, localY, angleDeg) {
  const a = degToRad(angleDeg);
  return {
    x: pivotX + localX * Math.cos(a) - localY * Math.sin(a),
    y: pivotY + localX * Math.sin(a) + localY * Math.cos(a),
  };
}

function setNextWeight(kg) {
  nextWeightKg = kg;
  ghostElement.textContent = `${kg}kg`;
  nextWeightValElement.textContent = `${kg} kg`;
}

function updateHudTotals() {
  leftWeightValue.textContent = `${leftTotal.toFixed(1)} kg`;
  rightWeightValue.textContent = `${rightTotal.toFixed(1)} kg`;
}

function recalcTargetAngle() {
  let leftTorque = 0;
  let rightTorque = 0;

  for (const item of placed) {
    const d = Math.abs(item.x);
    if (item.x < 0) leftTorque += item.kg * d;
    else rightTorque += item.kg * d;
  }

  const raw = (rightTorque - leftTorque) / TORQUE_DIVISOR;
  targetAngleDeg = clamp(raw, -MAX_ANGLE, MAX_ANGLE);
}

function sizeForKg(kg) {
  const minPx = 28;
  const maxPx = 64;
  const k = clamp(kg, 1, 10);
  return minPx + (k - 1) * (maxPx - minPx) / 9;
}

function renderPlacedFromState() {
  placedLayer.innerHTML = "";
  for (const item of placed) {
    const el = document.createElement("div");
    el.className = "weight weight--placed";
    el.textContent = `${item.kg}kg`;

    const size = sizeForKg(item.kg);
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    el.style.left = `calc(50% + ${Math.round(item.x)}px)`;
    el.style.top = `50%`;

    placedLayer.appendChild(el);
  }
}

function renderLogs() {
  if (!logBox) return;

  logBox.innerHTML = "";

  if (!logs.length) {
    logBox.classList.add("is-empty");
    logBox.innerHTML = `<div class="item">${LOG_PLACEHOLDER}</div>`;
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

function addLog(kg, x) {
  const line = formatLogLine(kg, x);
  logs = [line, ...logs].slice(0, LOG_LIMIT);
  renderLogs();
}

function saveState() {
  const payload = {
    placed,
    logs,
    nextWeightKg,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function normalizeLoadedState(saved) {
  const normPlaced = [];
  if (Array.isArray(saved?.placed)) {
    for (const p of saved.placed) {
      const kg = Number(p.kg);
      const x = Number(p.x);
      if (!Number.isFinite(kg) || !Number.isFinite(x)) continue;
      if (kg < 1 || kg > 10) continue;
      const half = PLANK_LENGTH / 2;
      normPlaced.push({ kg, x: clamp(x, -half, half) });
    }
  }

  const normLogs = Array.isArray(saved?.logs)
    ? saved.logs.filter((s) => typeof s === "string").slice(0, LOG_LIMIT)
    : [];

  const nw = Number(saved?.nextWeightKg);
  const normNext = Number.isFinite(nw) && nw >= 1 && nw <= 10 ? nw : null;

  return { placed: normPlaced, logs: normLogs, nextWeightKg: normNext };
}

function updateGhostFromPointer(clientX, clientY) {
  const sceneRect = sceneElement.getBoundingClientRect();

  const { localX, pivotX, pivotY } = getLocalOnPlankAxis(
    clientX,
    clientY,
    currentAngleDeg
  );

  const half = PLANK_LENGTH / 2;
  const clampedLocalX = clamp(localX, -half, half);

  const p = localToWorld(pivotX, pivotY, clampedLocalX, 0, currentAngleDeg);

  let x = p.x - sceneRect.left;
  let y = p.y - sceneRect.top - GHOST_OFFSET_Y;

  const size = ghostElement.getBoundingClientRect().width || 64;
  const pad = size / 2 + 8;
  x = clamp(x, pad, sceneRect.width - pad);
  y = clamp(y, pad, sceneRect.height - pad);

  ghostElement.style.left = `${x}px`;
  ghostElement.style.top = `${y}px`;
}

function createDropEl(kg, x) {
  const el = document.createElement("div");
  el.className = "weight weight--drop";
  el.textContent = `${kg}kg`;

  const size = sizeForKg(kg);
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;

  el.style.left = `calc(50% + ${Math.round(x)}px)`;
  el.style.top = `50%`;
  return el;
}

function dropWeightAt(x) {
  if (x < 0) leftTotal += nextWeightKg;
  else rightTotal += nextWeightKg;
  updateHudTotals();

  placed.push({ kg: nextWeightKg, x });

  addLog(nextWeightKg, x);

  recalcTargetAngle();

  const dropEl = createDropEl(nextWeightKg, x);
  placedLayer.appendChild(dropEl);
  requestAnimationFrame(() => dropEl.classList.add("is-set"));

  dropEl.addEventListener(
    "transitionend",
    () => {
      dropEl.classList.remove("weight--drop", "is-set");
      dropEl.classList.add("weight--placed");
    },
    { once: true }
  );

  setNextWeight(randWeight());

  saveState();
}

function resetAll() {
  placed = [];
  logs = [];
  leftTotal = 0;
  rightTotal = 0;

  targetAngleDeg = 0;

  placedLayer.innerHTML = "";
  updateHudTotals();
  renderLogs();

  setNextWeight(randWeight());

  clearState();
  saveState();
}

function startTiltLoop() {
  function tick() {
    currentAngleDeg += (targetAngleDeg - currentAngleDeg) * FOLLOW_SPEED;

    if (Math.abs(targetAngleDeg - currentAngleDeg) < SNAP_EPS) {
      currentAngleDeg = targetAngleDeg;
    }

    plankElement.style.transform =
  `translateX(-50%) rotate(${currentAngleDeg}deg)`;

    if (tiltAngleValElement) {
      tiltAngleValElement.textContent = `${currentAngleDeg.toFixed(1)}°`;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

sceneElement.addEventListener("pointermove", (e) => {
  updateGhostFromPointer(e.clientX, e.clientY);
});

plankElement.addEventListener("click", (e) => {
  const { localX } = getLocalOnPlankAxis(e.clientX, e.clientY, currentAngleDeg);

  const half = PLANK_LENGTH / 2;
  const clampedX = clamp(localX, -half, half);

  dropWeightAt(clampedX);
});

if (resetBtn) {
  resetBtn.addEventListener("click", resetAll);
}

(function init() {
  const saved = loadState();
  if (saved) {
    const norm = normalizeLoadedState(saved);
    placed = norm.placed;
    logs = norm.logs;

    if (norm.nextWeightKg != null) setNextWeight(norm.nextWeightKg);
    else setNextWeight(nextWeightKg);

    leftTotal = 0;
    rightTotal = 0;
    for (const item of placed) {
      if (item.x < 0) leftTotal += item.kg;
      else rightTotal += item.kg;
    }
  } else {
    setNextWeight(nextWeightKg);
  }

  updateHudTotals();
  renderPlacedFromState();
  renderLogs();

  recalcTargetAngle();
  startTiltLoop();

  saveState();
})();