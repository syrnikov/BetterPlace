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

  // ----- pan and zoom variables
  let panX = 0;
  let panY = 0;
  let zoom = 1;

  // ----- array to store placed pixels
  const placedPixels = [];

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

  function handleCanvasMouseDown(e) {
    if (e.button === 0) {
      // Left mouse button for pixel placement
      const canvasBounds = canvas.getBoundingClientRect();
      const x = (e.clientX - canvasBounds.left - panX) / zoom;
      const y = (e.clientY - canvasBounds.top - panY) / zoom;
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
    } else if (e.button === 2) {
      // Right mouse button for panning
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = "grabbing";
    }
  }

  // ----- pixel border cursor variables
  let showPixelBorder = false;
  let pixelBorderX = 0;
  let pixelBorderY = 0;

  function drawPixelBorder() {
    if (showPixelBorder) {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2;
      const borderX = pixelBorderX * PixelSize * zoom + panX;
      const borderY = pixelBorderY * PixelSize * zoom + panY;
      ctx.strokeRect(borderX, borderY, PixelSize * zoom, PixelSize * zoom);
    }
  }

  function handleCanvasMouseMove(e) {
    if (isDragging) {
      const deltaX = e.clientX - lastX;
      const deltaY = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      panX += deltaX;
      panY += deltaY;
      canvas.style.cursor = "grabbing";
      redraw();
    } else {
      // Calculate the pixel border position
      const canvasBounds = canvas.getBoundingClientRect();
      const x = (e.clientX - canvasBounds.left - panX) / zoom;
      const y = (e.clientY - canvasBounds.top - panY) / zoom;
      const pixelX = Math.floor(x / PixelSize);
      const pixelY = Math.floor(y / PixelSize);

      // Only show the pixel border cursor when cooldown is not active
      if (cooldownTime <= 0) {
        showPixelBorder = true;
        pixelBorderX = pixelX;
        pixelBorderY = pixelY;
      } else {
        showPixelBorder = false;
      }

      // Redraw the entire canvas with the updated pixel border cursor
      redraw();
    }
  }

  function handleCanvasMouseUp(e) {
    if (e.button === 2) {
      // Right mouse button
      isDragging = false;
      canvas.style.cursor = "default";
    }
  }

  function placePixel(pixelY, pixelX) {
    const StartX = pixelX * PixelSize * zoom + panX;
    const StartY = pixelY * PixelSize * zoom + panY;
    ctx.fillStyle = currentColor;
    ctx.fillRect(StartX, StartY, PixelSize * zoom, PixelSize * zoom);
    // Store the placed pixel in the array
    placedPixels.push({ x: pixelX, y: pixelY, color: currentColor });
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

  function handleWheelZoom(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const canvasBounds = canvas.getBoundingClientRect();
    const x = e.clientX - canvasBounds.left;
    const y = e.clientY - canvasBounds.top;
    const oldZoom = zoom;
    zoom *= zoomFactor;
    panX = x - (x - panX) * (zoom / oldZoom);
    panY = y - (y - panY) * (zoom / oldZoom);
    redraw();
  }

  function redraw() {
    clearCanvas();

    // Loop through the placedPixels array and redraw them with the correct transformations
    placedPixels.forEach((pixel) => {
      const StartX = pixel.x * PixelSize * zoom + panX;
      const StartY = pixel.y * PixelSize * zoom + panY;
      ctx.fillStyle = pixel.color;
      ctx.fillRect(StartX, StartY, PixelSize * zoom, PixelSize * zoom);
    });

    // Draw the pixel border cursor if required
    drawPixelBorder();
  }

  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  window.setColor = setColor;

  // Add event listeners for pixel placement, zoom, and pan
  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  canvas.addEventListener("mousemove", handleCanvasMouseMove);
  canvas.addEventListener("mouseup", handleCanvasMouseUp);
  canvas.addEventListener("mouseleave", () => {
    showPixelBorder = false;
    redraw();
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault()); // Prevent right-click context menu
  canvas.addEventListener("wheel", handleWheelZoom);

  // Initialize the canvas with a white background
  clearCanvas();
});
