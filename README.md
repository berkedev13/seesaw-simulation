# ⚖️ Seesaw Simulation

A physics-based balance simulation developed using pure HTML, CSS, and JavaScript (ES6+). Users can observe the torque balance and its real-time effects by placing weights at various points on the plank.

# Live Demo: https://username.github.io/seesaw-simulation

## 🧠 Thought Process and Design Decisions

This project aimed for both **physical accuracy** and **visual simplicity** during its development.

On the visual design side, the seesaw mechanics of the *Transformice* game were examined as a reference, and an attempt was made to achieve a similar sense of balance. Therefore:

- The plank is designed to rotate from the center.
- The weights have relative positions on the plank.
- The maximum tilt angle is limited to ±30°.

On the code side, readability and maintainability were prioritized. For this purpose, the project:

- Using **ES6 modules**, it was divided into three main parts: `app.js`, `logic.js`, and `ui.js`.
- Physics (torque calculations), UI, and application flow were separated from each other.

## ⚖️ Challenges and Limitations Encountered

- The ES6 modular structure was chosen to make the code more organized and scalable. As a natural consequence, the project must be run from a **local server**, not **directly from index.html**. 
- Therefore, a command like `python3 -m http.server` must be used during execution. 
- Physics calculations have been deliberately kept simple, and a **game-like deterministic equilibrium model** has been preferred over real-world physics.

## 🤖 AI Support

AI was used in a limited and controlled manner during the project development process:

- Editing the README documentation
- Some minor improvements and naming conventions on the UI side
- Receiving feedback during code organization

## 🚀 Features

* **Torque-Based Physics Calculations:** Left/right torque balance and tilt angle are calculated in real time based on the position and mass of the weights.
* **Visual Experience:** Mouse-controlled preview of "Ghost Weight".
    * Weight drop animation. 
    * Realistic tilt angle limited to a maximum of ±30°.
* **HUD (Heads-Up Display):** Displays left/right total weight, next weight, and current tilt angle information.
* **System Logs:** Real-time tracking of every operation performed.
* **LocalStorage Support:** Preserving the current state when the page is refreshed.
* **Zero Dependencies:** Modular structure built entirely with pure JavaScript, without the use of any frameworks or libraries.

## 🏗️ Project Structure

```text
├── index.html       # Main structure and DOM elements
├── styles.css       # Visual design 
└── js/
    ├── app.js       # Application launcher
    ├── logic.js     # Business logic 
    └── ui.js        # DOM manipulation and visual updates
```

## 🛠️ Running

Because this project uses ES Modules, it must be run from a local server instead of opening the file directly in a browser via the file path (file://).

Start the local server:
```bash
python3 -m http.server 3000
```

* Access: 
http://localhost:3000

# 📖 Usage Details
Adding Weight: You can drop the next weight by clicking on any point on the plank.

Reset: You can reset all simulation and saved data to return to the starting state.

Balance: When the left and right torques are equalized, the plank returns to the 0° position.