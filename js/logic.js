export const CONST = Object.freeze({
  PLANK_THICKNESS_PX: 16,
  PLANK_LENGTH_PX: 600,
  CLICK_TOLERANCE_PX: 0,

  GHOST_VERTICAL_OFFSET_PX: 140,

  WEIGHT_MIN_KG: 1,
  WEIGHT_MAX_KG: 10,
  MIN_WEIGHT_PX: 28,
  MAX_WEIGHT_PX: 64,

  MAX_ANGLE_DEG: 30,
  TORQUE_TO_ANGLE_DIV: 30,
  FOLLOW_SPEED: 0.12,
  SNAP_EPS: 0.02,

  LOG_LIMIT: 30,
  LOG_PLACEHOLDER_TEXT: "No drops yet",

  STORAGE_KEY: "seesaw_state_v1",
});

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomWeight() {
  return randomInt(CONST.WEIGHT_MIN_KG, CONST.WEIGHT_MAX_KG);
}

export function degreeToRadius(deg) {
  return (deg * Math.PI) / 180;
}

export function sizeForWeight(kg) {
  const k = clamp(kg, CONST.WEIGHT_MIN_KG, CONST.WEIGHT_MAX_KG);
  return (
    CONST.MIN_WEIGHT_PX +
    (k - 1) * (CONST.MAX_WEIGHT_PX - CONST.MIN_WEIGHT_PX) / 9
  );
}

export function getLocalCoordsOnBeamAxis(clientX, clientY, el, angleDeg) {
  const rect = el.getBoundingClientRect();
  const pivotX = rect.left + rect.width / 2;
  const pivotY = rect.top + rect.height / 2;

  const dx = clientX - pivotX;
  const dy = clientY - pivotY;

  const a = degreeToRadius(angleDeg);

  const localX = dx * Math.cos(a) + dy * Math.sin(a);
  const localY = -dx * Math.sin(a) + dy * Math.cos(a);

  return { localX, localY, pivotX, pivotY };
}

export function localToWorld(pivotX, pivotY, localX, localY, angleDeg) {
  const a = degreeToRadius(angleDeg);
  const worldX = pivotX + localX * Math.cos(a) - localY * Math.sin(a);
  const worldY = pivotY + localX * Math.sin(a) + localY * Math.cos(a);
  return { worldX, worldY };
}

export function computeSideTotals(placed) {
  let left = 0;
  let right = 0;
  for (const item of placed) {
    if (item.x < 0) left += item.kg;
    else right += item.kg;
  }
  return { left, right };
}

export function computeTorques(placed) {
  let leftTorque = 0;
  let rightTorque = 0;

  for (const item of placed) {
    const d = Math.abs(item.x);
    if (item.x < 0) leftTorque += item.kg * d;
    else rightTorque += item.kg * d;
  }

  return { leftTorque, rightTorque };
}

export function computeTargetAngleDegree({ leftTorque, rightTorque }) {
  const raw = (rightTorque - leftTorque) / CONST.TORQUE_TO_ANGLE_DIV;
  return clamp(raw, -CONST.MAX_ANGLE_DEG, CONST.MAX_ANGLE_DEG);
}

export function clampDropX(localX, kg) {
  const half = CONST.PLANK_LENGTH_PX / 2;
  const safeHalf = half - sizeForWeight(kg) / 2;
  return clamp(localX, -safeHalf, safeHalf);
}

export function isClickOnPlank(localY) {
  const allowed = CONST.PLANK_THICKNESS_PX / 2 + CONST.CLICK_TOLERANCE_PX;
  return Math.abs(localY) <= allowed;
}

export function formatLogLine(kg, x) {
  const side = x < 0 ? "left" : "right";
  const dist = Math.round(Math.abs(x));
  return `${kg}kg dropped on ${side} side at ${dist}px from center`;
}