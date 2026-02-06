import {
  CONST,
  randomWeight,
  getLocalCoordsOnBeamAxis,
  computeSideTotals,
  computeTorques,
  computeTargetAngleDegree,
  clampDropX,
  isClickOnPlank,
  formatLogLine,
} from "./logic.js";

import {
  getEls,
  renderHUD,
  renderPlaced,
  setGhostWeight,
  updateGhostFromPointer,
  createDropEl,
  animateDropToPlaced,
  renderLogs,
  saveState,
  loadState,
  clearState,
  normalizeLoadedState,
  setPlankAngle,
} from "./ui.js";

const els = getEls();

const state = {
  placed: [],
  logs: [],
  nextWeight: randomWeight(),

  currentAngleDegree: 0,
  targetAngleDegree: 0,

  pointer: { has: false, x: 0, y: 0, rafPending: false },
};

boot();
bindEvents();
startTiltLoop();

function boot() {
  const saved = loadState();
  if (saved) {
    const normalized = normalizeLoadedState(saved);
    state.placed = normalized.placed;
    state.logs = normalized.logs;
    state.nextWeight = normalized.nextWeight ?? randomWeight();
  }

  setGhostWeight(els.ghostElement, state.nextWeight);

  state.targetAngleDegree = computeTargetAngleDegree(computeTorques(state.placed));
  renderPlaced(els.placedLayer, state.placed);
  renderLogs(els.logBox, state.logs);

  renderAll();
  persist();
}

function bindEvents() {
  els.sceneElement.addEventListener("pointermove", onPointerMove);
  els.plankElement.addEventListener("click", onPlankClick);
  els.resetBtn.addEventListener("click", onReset);
}

function renderAll() {
  const totals = computeSideTotals(state.placed);
  renderHUD(els, totals, state.nextWeight, state.currentAngleDegree);
}

function persist() {
  saveState({
    placed: state.placed,
    nextWeight: state.nextWeight,
    logs: state.logs,
  });
}

function onPointerMove(e) {
  state.pointer.x = e.clientX;
  state.pointer.y = e.clientY;
  state.pointer.has = true;

  if (state.pointer.rafPending) return;
  state.pointer.rafPending = true;

  requestAnimationFrame(() => {
    state.pointer.rafPending = false;
    updateGhostFromPointer(els, state.nextWeight, state.currentAngleDegree, state.pointer.x, state.pointer.y);
  });
}

function onPlankClick(e) {
  const { localX, localY } = getLocalCoordsOnBeamAxis(e.clientX, e.clientY, els.plankElement, state.currentAngleDegree);

  if (!isClickOnPlank(localY)) return;

  const dropX = clampDropX(localX, state.nextWeight);

  state.placed.push({ kg: state.nextWeight, x: dropX });
  state.targetAngleDegree = computeTargetAngleDegree(computeTorques(state.placed));

  const line = formatLogLine(state.nextWeight, dropX);
  state.logs = [line, ...state.logs].slice(0, CONST.LOG_LIMIT);
  renderLogs(els.logBox, state.logs);

  const dropElement = createDropEl(state.nextWeight, dropX);
  els.placedLayer.appendChild(dropElement);
  animateDropToPlaced(dropElement);

  state.nextWeight = randomWeight();
  setGhostWeight(els.ghostElement, state.nextWeight);

  renderAll();
  persist();
}

function onReset() {
  state.placed = [];
  state.logs = [];
  state.targetAngleDegree = 0;

  els.placedLayer.innerHTML = "";
  renderLogs(els.logBox, state.logs);

  state.nextWeight = randomWeight();
  setGhostWeight(els.ghostElement, state.nextWeight);

  renderAll();
  clearState();
  persist();
}

function startTiltLoop() {
  function tick() {
    state.currentAngleDegree += (state.targetAngleDegree - state.currentAngleDegree) * CONST.FOLLOW_SPEED;

    if (Math.abs(state.targetAngleDegree - state.currentAngleDegree) < CONST.SNAP_EPS) {
      state.currentAngleDegree = state.targetAngleDegree;
    }

    setPlankAngle(els, state.currentAngleDegree);

    if (state.pointer.has) {
      updateGhostFromPointer(els, state.nextWeight, state.currentAngleDegree, state.pointer.x, state.pointer.y);
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}