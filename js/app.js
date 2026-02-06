const sceneElement = document.getElementById("scene");
const plankElement = document.getElementById("plank");
const ghostElement = document.getElementById("ghostWeight");
const nextWeightValElement = document.getElementById("nextWeightVal");
const tiltAngleValElement = document.getElementById("tiltAngleVal");

const placedLayer = plankElement.querySelector(".placed-layer");

const leftWeightValue = document.getElementById("leftWeightVal");
const rightWeightValue = document.getElementById("rightWeightVal");

const PLANK_LENGTH = 600;
const GHOST_OFFSET_Y = 140;

const MAX_ANGLE = 30;
const FOLLOW_SPEED = 0.18; 
const SNAP_EPS = 0.02;

let currentAngleDeg = 0;
let targetAngleDeg = 0;

let leftTotal = 0;
let rightTotal = 0;

let nextWeight = randomWeight();

function randomWeight() {
  return Math.floor(Math.random() * 10) + 1;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
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
  nextWeight = kg;
  ghostElement.textContent = `${nextWeight}kg`;
  nextWeightValElement.textContent = `${nextWeight} kg`;
}

function updateHudTotals() {
  leftWeightValue.textContent = `${leftTotal.toFixed(1)} kg`;
  rightWeightValue.textContent = `${rightTotal.toFixed(1)} kg`;
}

function recalcTargetAngle() {
  let leftTorque = 0;
  let rightTorque = 0;

  const plankRect = plankElement.getBoundingClientRect();
  const centerX = plankRect.left + plankRect.width / 2;

  placedLayer.querySelectorAll(".weight--placed, .weight--drop").forEach((el) => {
    const rect = el.getBoundingClientRect();
    const xCenter = rect.left + rect.width / 2;
    const x = xCenter - centerX;

    const kg = parseInt(el.textContent, 10);
    if (!Number.isFinite(kg)) return;

    const distance = Math.abs(x);

    if (x < 0) leftTorque += kg * distance;
    else rightTorque += kg * distance;
  });

  const rawAngle = (rightTorque - leftTorque) / 30;
  targetAngleDeg = clamp(rawAngle, -MAX_ANGLE, MAX_ANGLE);
}

function startTiltLoop() {
  function tick() {
    currentAngleDeg += (targetAngleDeg - currentAngleDeg) * FOLLOW_SPEED;

    if (Math.abs(targetAngleDeg - currentAngleDeg) < SNAP_EPS) {
      currentAngleDeg = targetAngleDeg;
    }

    plankElement.style.transform = `translateX(-50%) rotate(${currentAngleDeg}deg)`;
    if (tiltAngleValElement) {
      tiltAngleValElement.textContent = `${currentAngleDeg.toFixed(1)}°`;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
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

function dropWeightAt(localX) {
  if (localX < 0) leftTotal += nextWeight;
  else rightTotal += nextWeight;
  updateHudTotals();

  const dropElement = document.createElement("div");
  dropElement.className = "weight weight--drop";
  dropElement.textContent = `${nextWeight}kg`;

  dropElement.style.left = `calc(50% + ${Math.round(localX)}px)`;
  dropElement.style.top = `50%`;

  placedLayer.appendChild(dropElement);

  recalcTargetAngle();

  requestAnimationFrame(() => dropElement.classList.add("is-set"));

  dropElement.addEventListener(
    "transitionend",
    () => {
      dropElement.classList.remove("weight--drop", "is-set");
      dropElement.classList.add("weight--placed");

      recalcTargetAngle();
    },
    { once: true }
  );

  setNextWeight(randomWeight());
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

setNextWeight(nextWeight);
updateHudTotals();
recalcTargetAngle();
startTiltLoop();