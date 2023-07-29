// renderer.js

// Import the necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";

// Your existing code...

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCnglllo9tD1B-LrzVszFyXvhfN2j5Go2w",
  authDomain: "betterplace-b236d.firebaseapp.com",
  databaseURL:
    "https://betterplace-b236d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "betterplace-b236d",
  storageBucket: "betterplace-b236d.appspot.com",
  messagingSenderId: "764902930248",
  appId: "1:764902930248:web:c1b20982ff45cd1d8be57d",
  measurementId: "G-ZTJ0CC2QKV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(); // Get the Firebase database object

// ----- Canvas related setup -----

// ... (your existing canvas-related code)

// ----- Array to store plalet placedPixels = [];

// Function to save placedPixels data to Firebase database
function savePlacedPixelsToDatabase() {
  const pixelsRef = ref(database, "pixels");
  const pixelData = {};

  placedPixels.forEach((pixel) => {
    const key = `${pixel.y}_${pixel.x}`;
    pixelData[key] = { color: pixel.color };
  });

  set(pixelsRef, pixelData);
}

let placedPixels = [];

document.addEventListener("DOMContentLoaded", () => {
  //setup ------- canvas settings
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // -------- variables
  ctx.fillStyle = "#fff";
  let currentColor = "#000";
  const canvasRes = 1000;
  const PixelSize = canvas.width / canvasRes;
  let cooldownTime = 0;
  const cooldownInterval = 1000; // 1 second in milliseconds

  // Function to initialize canvas from Firebase database
  function initializeCanvasFromDatabase() {
    const pixelsRef = ref(database, "pixels");
    onValue(pixelsRef, (snapshot) => {
      const pixelData = snapshot.val();
      if (pixelData) {
        for (const key in pixelData) {
          const [y, x] = key.split("_");
          placedPixels.push({
            x: parseInt(x),
            y: parseInt(y),
            color: pixelData[key].color,
          });
        }

        redraw();
      }
    });
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function updateCooldownDisplay() {
    const cooldownDisplay = document.getElementById("cooldown");
    if (cooldownTime > 0) {
      cooldownDisplay.textContent = `${cooldownTime} seconds`;
    } else {
      cooldownDisplay.textContent = "";
    }
  }

  function startCooldown() {
    cooldownTime = 60 * 5; //cooldown
    updateCooldownDisplay();
    const cooldownIntervalId = setInterval(() => {
      cooldownTime--;
      updateCooldownDisplay();
      if (cooldownTime <= 0) {
        clearInterval(cooldownIntervalId);
      }
    }, cooldownInterval);
  }

  function placePixel(pixelY, pixelX) {
    const StartX = pixelX * PixelSize;
    const StartY = pixelY * PixelSize;
    ctx.fillStyle = currentColor;
    ctx.fillRect(StartX, StartY, PixelSize, PixelSize);

    // Store the placed pixel in the array
    placedPixels.push({ x: pixelX, y: pixelY, color: currentColor });

    // Save the placed pixel data to the Firebase database
    const pixelRef = ref(database, `pixels/${pixelY}_${pixelX}`);
    set(pixelRef, { color: currentColor });
  }

  function listenForPixelChanges() {
    const pixelsRef = ref(database, "pixels");
    onValue(pixelsRef, (snapshot) => {
      const pixelData = snapshot.val();
      if (pixelData) {
        // Clear the existing placed pixels array
        placedPixels.length = 0;

        // Loop through the pixel data and update the placedPixels array
        for (const key in pixelData) {
          const [y, x] = key.split("_");
          placedPixels.push({
            x: parseInt(x),
            y: parseInt(y),
            color: pixelData[key].color,
          });
        }

        // Redraw the canvas with the updated pixel data
        redraw();
      }
    });
  }

  function selectColor(colorElement) {
    // Remove the "selected" class from all colors
    const colors = document.querySelectorAll(".color");
    colors.forEach((color) => color.classList.remove("selected"));

    // Add the "selected" class to the clicked color element
    colorElement.classList.add("selected");
  }

  function setColor(color) {
    currentColor = color;
    const selectedColorElement = document.querySelector(
      `[style="background-color: ${currentColor};"]`
    );
    if (selectedColorElement) {
      selectColor(selectedColorElement);
    }
  }

  function redraw() {
    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply the inverse transformations (zoom and pan) to the canvas context
    ctx.save();
    // Loop through the placedPixels array and redraw them with the correct transformations
    placedPixels.forEach((pixel) => {
      const StartX = pixel.x * PixelSize;
      const StartY = pixel.y * PixelSize;
      ctx.fillStyle = pixel.color;
      ctx.fillRect(StartX, StartY, PixelSize, PixelSize);
    });
    // Restore the canvas context to its original state (remove the transformations)
    ctx.restore();
  }
  function handleCanvasMouseDown(e) {
    if (e.button === 0) {
      // Left mouse button for pixel placement
      const canvasBounds = canvas.getBoundingClientRect();
      const x = e.clientX - canvasBounds.left;
      const y = e.clientY - canvasBounds.top;
      const pixelX = Math.floor(x / PixelSize);
      const pixelY = Math.floor(y / PixelSize);

      if (
        pixelX >= 0 &&
        pixelX < canvasRes &&
        pixelY >= 0 &&
        pixelY < canvasRes &&
        cooldownTime <= 0 // Check if the cooldown is over
      ) {
        placePixel(pixelY, pixelX);
        startCooldown(); // Start the cooldown timer after placing the pixel
      }
    }
  }

  window.setColor = setColor;
  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault()); // Prevent right-click context menu

  // Initialize the canvas with a white background
  // Call the function to listen for pixel changes
  listenForPixelChanges();
  initializeCanvasFromDatabase();
});
