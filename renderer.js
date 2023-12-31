function hidePreloader() {
  setTimeout(() => {
    const preloaderIframe = document.getElementById("preloader-iframe");
    preloaderIframe.style.display = "none";
  }, 1500); // 2000 milliseconds = 2 seconds
}

// renderer.js
const ver = 5;
// Import the necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
// renderer.js

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  //your firebase storage config should be here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(); // Get the Firebase database object
const auth = getAuth();

async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Fetch the usernick from the Firebase database
    const user = userCredential.user;
    const userRef = ref(database, `users/${user.uid}`);

    // Create a promise to handle the asynchronous retrieval of usernick
    return new Promise((resolve, reject) => {
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          const usernick = userData.usernick;
          document.getElementById("Stats-username").textContent = usernick;
          document.getElementById("login").style.display = "none";

          // Save the user's login data in localStorage using the exposed electronAPI
          const loginData = { email, password };
          electronAPI.localStorage.setItem(
            "loginData",
            JSON.stringify(loginData)
          );

          resolve(usernick); // Resolve the promise with usernick
        } else {
          reject(new Error("User data not found"));
        }
      });
    });
  } catch (error) {
    console.error("Error logging in:", error.message);
    document.getElementById("LoginError").style.display = "block";
    throw error; // Rethrow the error to handle it in the calling code, if necessary
  }
}

function initializeVersionCheck() {
  const versionRef = ref(database, "constants/version");
  onValue(versionRef, (snapshot) => {
    const remoteVersion = snapshot.val()?.number; // Access the "number" field from the snapshot
    if (remoteVersion !== ver) {
      // Show the "update" div because the versions don't match
      const updateDiv = document.getElementById("update");
      updateDiv.style.display = "flex";
    }
  });
}

function saveLoginData(email, password) {
  // Save the user's login data in localStorage using the exposed electronAPI
  const loginData = { email, password };
  electronAPI.localStorage.setItem("loginData", JSON.stringify(loginData));
}

function handleUserLogin(email, password) {
  loginUser(email, password)
    .then((usernick) => {
      // The user is already logged in, initialize the canvas and listeners
      listenForPixelChanges();
      initializeCanvasFromDatabase();
      saveLoginData(email, password);
    })
    .catch((error) => {
      console.error("Error logging in:", error.message);
      document.getElementById("LoginError").style.display = "block";
    });
}
async function registerUser(usernick, email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Save the usernick in the user's data in the Firebase database
    const user = userCredential.user;
    const userRef = ref(database, `users/${user.uid}`);
    set(userRef, { email, usernick });

    // The user is registered successfully
    console.log("User registered:", user.uid);
    document.getElementById("Stats-username").textContent = usernick;
    document.getElementById("login").style.display = "none";
  } catch (error) {
    console.error("Error registering user:", error.message);
    document.getElementById("LoginError").style.display = "block";
  }
}
document.getElementById("register-button").addEventListener("click", () => {
  const usernick = document.getElementById("usernick").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  registerUser(usernick, email, password);
});
document.getElementById("login-button").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  handleUserLogin(email, password);
});

function savePlacedPixelsToDatabase() {
  const pixelsRef = ref(database, "pixels");
  const pixelData = {};

  placedPixels.forEach((pixel) => {
    const key = `${pixel.y}_${pixel.x}`;
    pixelData[key] = { color: pixel.color, username: pixel.username }; // Store the username along with the pixel data
  });

  set(pixelsRef, pixelData);
}

let placedPixels = [];

document.addEventListener("DOMContentLoaded", () => {
  // Function for user registration
  // Function for user registration
  // Function for user registration

  // Function for user login

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

  // ----- Canvas related setup -----
  function initializeCanvasFromDatabase() {
    const pixelsRef = ref(database, "pixels");
    onValue(pixelsRef, (snapshot) => {
      const pixelData = snapshot.val();
      if (pixelData) {
        // Clear the existing placed pixels array
        placedPixels.length = 0;

        // Loop through the pixel data and update the placedPixels array
        for (const key in pixelData) {
          const [y, x] = key.split("_");
          const username = pixelData[key].username; // Retrieve the username from the database
          placedPixels.push({
            x: parseInt(x),
            y: parseInt(y),
            color: pixelData[key].color,
            username: username, // Store the username in the placedPixels array
          });
        }

        // Redraw the canvas with the updated pixel data
        redraw();
      }
    });
  }
  // ... (your existing canvas-related code)
  function checkIfUserLoggedIn() {
    const savedLoginData = electronAPI.localStorage.getItem("loginData");
    if (savedLoginData) {
      const { email, password } = JSON.parse(savedLoginData);
      if (email && password) {
        // Automatically log in the user using the saved login data
        loginUser(email, password).then(() => {
          // The user is already logged in, initialize the canvas and listeners
          listenForPixelChanges();
          initializeCanvasFromDatabase();
        });
      }
    }
  }
  // ----- Array to store plalet placedPixels = [];

  // Function to save placedPixels data to Firebase database
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

  // Function for user login

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
  initializeVersionCheck();

  const savedLoginData = electronAPI.localStorage.getItem("loginData");
  if (savedLoginData) {
    const { email, password } = JSON.parse(savedLoginData);
    if (email && password) {
      // Automatically log in the user using the saved login data
      loginUser(email, password);
    }
  }
  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function updateCooldownDisplay() {
    const cooldownDisplay = document.getElementById("cooldown");
    if (cooldownTime > 0) {
      cooldownDisplay.textContent = ` ${cooldownTime}`;
    } else {
      cooldownDisplay.textContent = "Place a pixel!";
    }
  }
  // // function setVersionNumber(versionNumber) {
  // //   const versionRef = ref(database, "constants/cooldown");
  // //   set(versionRef, { time: versionNumber })
  // //     .then(() => {
  // //       console.log("Version number set successfully!");
  // //     })
  // //     .catch((error) => {
  // //       console.error("Error setting version number:", error);
  // //     });
  // // }

  // // Call this function to set the version number (e.g., when you release a new version)
  // setVersionNumber(10); // Set the version number to 1

  function initializeCooldownCheck() {
    const cooldownRef = ref(database, "constants/cooldown/time");
    onValue(cooldownRef, (snapshot) => {
      const remoteCooldown = snapshot.val();
      if (remoteCooldown !== null) {
        cooldownTime = remoteCooldown;
        updateCooldownDisplay();
      }
    });
  }

  function startCooldown() {
    isCooldownActive = true; // Set the flag to indicate that the cooldown is active
    const cooldownRef = ref(database, "constants/cooldown/time");
    onValue(cooldownRef, (snapshot) => {
      const remoteCooldown = snapshot.val();
      if (remoteCooldown !== null) {
        cooldownTime = remoteCooldown;
        updateCooldownDisplay();

        // Set cooldownTime to 1 before starting the countdown
        if (cooldownTime <= 0) {
          cooldownTime = 1;
        }

        const cooldownIntervalId = setInterval(() => {
          cooldownTime--;
          updateCooldownDisplay();
          if (cooldownTime <= 0) {
            clearInterval(cooldownIntervalId);
            isCooldownActive = false; // Reset the flag when the cooldown is over
          }
        }, cooldownInterval);
      }
    });
  }

  function placePixel(pixelY, pixelX) {
    const StartX = pixelX * PixelSize;
    const StartY = pixelY * PixelSize;
    const existingPixelIndex = placedPixels.findIndex(
      (pixel) => pixel.x === pixelX && pixel.y === pixelY
    );

    if (currentColor === "#fff") {
      // If the current color is white, we want to erase the existing pixel.
      if (existingPixelIndex !== -1) {
        // Remove the pixel from the placedPixels array
        placedPixels.splice(existingPixelIndex, 1);

        // Remove the pixel data from the Firebase database
        const pixelRef = ref(database, `pixels/${pixelY}_${pixelX}`);
        set(pixelRef, null);
      }
    } else {
      // If the current color is not white, we want to place a colored pixel.
      ctx.fillStyle = currentColor;
      ctx.fillRect(StartX, StartY, PixelSize, PixelSize);

      // Get the logged-in user's usernick from the Firebase database
      const userRef = ref(database, `users/${auth.currentUser.uid}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          const usernick = userData.usernick;
          const pixel = {
            x: pixelX,
            y: pixelY,
            color: currentColor,
            username: usernick,
          };

          if (existingPixelIndex !== -1) {
            // If there was an existing pixel, replace it with the new one
            placedPixels[existingPixelIndex] = pixel;
          } else {
            // Otherwise, add the new pixel to the placedPixels array
            placedPixels.push(pixel);
          }

          // Save the placed pixel data to the Firebase database
          const pixelRef = ref(database, `pixels/${pixelY}_${pixelX}`);
          set(pixelRef, { color: currentColor, username: usernick });
        }
      });
    }
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
      ctx.strokeStyle = currentColor; // Set the border color (change as needed)
      ctx.lineWidth = 2; // Set the border width (change as needed)
      ctx.strokeRect(StartX, StartY, PixelSize, PixelSize);
    }
    const hoveredPixel = placedPixels.find((pixel) => {
      const StartX = Math.floor(cursorX / PixelSize) * PixelSize;
      const StartY = Math.floor(cursorY / PixelSize) * PixelSize;
      return (
        pixel.x === Math.floor(StartX / PixelSize) &&
        pixel.y === Math.floor(StartY / PixelSize)
      );
    });

    // Display the username if a pixel is found at the cursor position
    if (hoveredPixel) {
      ctx.font = "12px Peaberry";
      ctx.fillStyle = "#000000";
      ctx.fillText(hoveredPixel.username, cursorX, cursorY + 20);
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
    zoom /= 1.3; // Decrease zoom level by 5% (adjust this value for faster/slower zoom)
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
    cursorX = Math.round(cursorX); // Round cursorX to the nearest integer
    cursorY = Math.round(cursorY); // Round cursorY to the nearest integer
    redraw();

    // Update the text content of "cursor-position" div
    const cursorPositionDiv = document.getElementById("cursor-position");
    if (cursorPositionDiv) {
      cursorPositionDiv.textContent = `Cursor Position: (${cursorX}, ${cursorY})`;
    }
  }

  window.setColor = setColor;

  canvas.addEventListener("mouseleave", handleCanvasMouseLeave);
  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault()); // Prevent right-click context menu
  canvas.addEventListener("mousemove", handleCanvasMouseMove);
  // Initialize the canvas with a white background
  // Call the function to listen for pixel changes
  listenForPixelChanges();
  initializeCanvasFromDatabase();
  checkIfUserLoggedIn();
  hidePreloader();
});
