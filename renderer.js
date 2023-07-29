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
  let isCooldownActive = false;
  const cooldownInterval = 1000; // 1 second in milliseconds
  let zoom = 1.0;
  let panX = 0;
  let panY = 0;

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
    isCooldownActive = true; // Set the flag to indicate that the cooldown is active
    cooldownTime = 60 * 5; //cooldown
    updateCooldownDisplay();
    const cooldownIntervalId = setInterval(() => {
      cooldownTime--;
      updateCooldownDisplay();
      if (cooldownTime <= 0) {
        clearInterval(cooldownIntervalId);
        isCooldownActive = false; // Reset the flag when the cooldown is over
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

    // Apply zoom transformation
    ctx.scale(zoom, zoom);

    // Apply pan transformation
    ctx.translate(panX, panY);

    // Loop through the placedPixels array and redraw them with the correct transformations
    placedPixels.forEach((pixel) => {
      const StartX = pixel.x * PixelSize;
      const StartY = pixel.y * PixelSize;
      ctx.fillStyle = pixel.color;
      ctx.fillRect(StartX, StartY, PixelSize, PixelSize);
    });

    // Restore the canvas context to its original state (remove the transformations)
    if (
      cursorX >= 0 &&
      cursorX < canvas.width &&
      cursorY >= 0 &&
      cursorY < canvas.height
    ) {
      drawCursorBorder();
    }
    ctx.restore();
  }

  function handleCanvasMouseLeave() {
    if (!isCooldownActive) {
      // Reset the cursor position when the mouse leaves the canvas only if cooldown is not active
      cursorX = -1;
      cursorY = -1;
      redraw();
    }
  }

  function handleCanvasMouseDown(e) {
    if (e.button === 0) {
      // Left mouse button for pixel placement
      const canvasBounds = canvas.getBoundingClientRect();
      const x = (e.clientX - canvasBounds.left) / zoom - panX; // Apply zoom and pan
      const y = (e.clientY - canvasBounds.top) / zoom - panY;
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

  let cursorX = 0;
  let cursorY = 0;

  function drawCursorBorder() {
    if (!isCooldownActive) {
      // Draw the border outline around the cursor position
      const StartX = Math.floor(cursorX / PixelSize) * PixelSize;
      const StartY = Math.floor(cursorY / PixelSize) * PixelSize;
      ctx.strokeStyle = "#000"; // Set the border color (change as needed)
      ctx.lineWidth = 2; // Set the border width (change as needed)
      ctx.strokeRect(StartX, StartY, PixelSize, PixelSize);
    }
  }

  function zoomIn(e) {
    const cursorX = e.clientX - canvas.offsetLeft; // Cursor position relative to canvas
    const cursorY = e.clientY - canvas.offsetTop;

    // Calculate the change in canvas position due to zooming at the cursor center
    const dx = (cursorX - panX) / zoom;
    const dy = (cursorY - panY) / zoom;

    // Apply the new zoom and pan offsets
    zoom *= 1.05; // Increase zoom level by 5% (adjust this value for faster/slower zoom)
    panX = cursorX - dx * zoom;
    panY = cursorY - dy * zoom;
    redraw();
  }

  function zoomOut(e) {
    const cursorX = e.clientX - canvas.offsetLeft; // Cursor position relative to canvas
    const cursorY = e.clientY - canvas.offsetTop;

    // Calculate the change in canvas position due to zooming at the cursor center
    const dx = (cursorX - panX) / zoom;
    const dy = (cursorY - panY) / zoom;

    // Apply the new zoom and pan offsets
    zoom /= 1.05; // Decrease zoom level by 5% (adjust this value for faster/slower zoom)
    panX = cursorX - dx * zoom;
    panY = cursorY - dy * zoom;
    redraw();
  }

  function pan(dx, dy) {
    panX += dx; // Invert the pan direction here (use += instead of -=)
    panY += dy; // Invert the pan direction here (use += instead of -=)
    redraw();
  }

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn(e); // Pass the event object
    } else {
      zoomOut(e); // Pass the event object
    }
  });

  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 1 || e.button === 2) {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    }
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
  });

  canvas.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      pan(dx, dy);
      lastX = e.clientX;
      lastY = e.clientY;
    }
  });

  function handleCanvasMouseMove(e) {
    // Update the cursor position on mouse move
    const canvasBounds = canvas.getBoundingClientRect();
    cursorX = (e.clientX - canvasBounds.left) / zoom - panX;
    cursorY = (e.clientY - canvasBounds.top) / zoom - panY;
    redraw();
  }

  window.setColor = setColor;
  canvas.addEventListener("mousemove", handleCanvasMouseMove);
  canvas.addEventListener("mouseleave", handleCanvasMouseLeave);
  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault()); // Prevent right-click context menu

  // Initialize the canvas with a white background
  // Call the function to listen for pixel changes
  listenForPixelChanges();
  initializeCanvasFromDatabase();
});
