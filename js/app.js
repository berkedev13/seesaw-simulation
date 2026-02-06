const sceneEl = document.getElementById("scene");
const plankEl = document.getElementById("plank");
const ghostEl = document.getElementById("ghostWeight");
const nextWeightValEl = document.getElementById("nextWeightVal");

const PLANK_LENGTH = 600;
const GHOST_OFFSET_Y = 140;

const placedLayer = plankElement.querySelector(".placed-layer");

const leftWeightValue = document.getElementById("leftWeightVal");
const rightWeightValue = document.getElementById("rightWeightVal");

let leftTotal = 0;
let rightTotal = 0;

function randomWeight() {
  return Math.floor(Math.random() * 10) + 1;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

let nextWeight = randomWeight();
ghostElement.textContent = `${nextWeight}kg`;
nextWeightValElement.textContent = `${nextWeight} kg`;

sceneEl.addEventListener("pointermove", (e) => {
  const plankRect = plankEl.getBoundingClientRect();
  const sceneRect = sceneEl.getBoundingClientRect();

  let localX = e.clientX - (plankRect.left + plankRect.width / 2);

  const half = PLANK_LENGTH / 2;
  localX = clamp(localX, -half, half);

  const x = plankRect.left + plankRect.width / 2 + localX - sceneRect.left;
  const y = plankRect.top + plankRect.height / 2 - sceneRect.top - GHOST_OFFSET_Y;

  ghostElement.style.left = `${x}px`;
  ghostElement.style.top = `${y}px`;
});

plankElement.addEventListener("click", (e) => {
  const plankRect = plankElement.getBoundingClientRect();

  let localX = e.clientX - (plankRect.left + plankRect.width / 2);
  const half = PLANK_LENGTH / 2;
  localX = clamp(localX, -half, half);

  if (localX < 0) leftTotal += nextWeight;
  else rightTotal += nextWeight;

  leftWeightValue.textContent = `${leftTotal.toFixed(1)} kg`;
  rightWeightValue.textContent = `${rightTotal.toFixed(1)} kg`;

  const dropElement = document.createElement("div");
  dropElement.className = "weight weight--drop";
  dropElement.textContent = `${nextWeight}kg`;

  dropElement.style.left = `calc(50% + ${Math.round(localX)}px)`;
  dropElement.style.top = `50%`;

  placedLayer.appendChild(dropElement);

  requestAnimationFrame(() => {
    dropElement.classList.add("is-set");
  });

  dropElement.addEventListener("transitionend", () => {
    dropElement.classList.remove("weight--drop", "is-set");
    dropElement.classList.add("weight--placed");
  }, { once: true });

  nextWeight = randomWeight();
  ghostElement.textContent = `${nextWeight}kg`;
  nextWeightValElement.textContent = `${nextWeight} kg`;
});