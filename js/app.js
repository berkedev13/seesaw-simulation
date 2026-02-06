const sceneEl = document.getElementById("scene");
const plankEl = document.getElementById("plank");
const ghostEl = document.getElementById("ghostWeight");
const nextWeightValEl = document.getElementById("nextWeightVal");

const PLANK_LENGTH = 600;
const GHOST_OFFSET_Y = 140;

function randWeight() {
  return Math.floor(Math.random() * 10) + 1;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const nextWeightKg = randWeight();
ghostEl.textContent = `${nextWeightKg}kg`;
nextWeightValEl.textContent = `${nextWeightKg} kg`;

sceneEl.addEventListener("pointermove", (e) => {
  const plankRect = plankEl.getBoundingClientRect();
  const sceneRect = sceneEl.getBoundingClientRect();

  let localX = e.clientX - (plankRect.left + plankRect.width / 2);

  const half = PLANK_LENGTH / 2;
  localX = clamp(localX, -half, half);

  const x = plankRect.left + plankRect.width / 2 + localX - sceneRect.left;
  const y = plankRect.top + plankRect.height / 2 - sceneRect.top - GHOST_OFFSET_Y;

  ghostEl.style.left = `${x}px`;
  ghostEl.style.top = `${y}px`;
});