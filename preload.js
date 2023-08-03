const { contextBridge, ipcRenderer } = require("electron");

// Define the APIs you want to expose to the renderer process
window.ipcRenderer = ipcRenderer;
const exposedAPI = {
  localStorage: {
    getItem: (key) => {
      // Implement the functionality to retrieve data from localStorage
      return localStorage.getItem(key);
    },
    // Add other functions related to localStorage if needed
  },
  // Add other APIs that you want to expose to the renderer process
};

// Expose the APIs to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  ipcRenderer: ipcRenderer,
  localStorage: {
    getItem: (key) => {
      // Implement the functionality to retrieve data from localStorage
      return localStorage.getItem(key);
    },
    setItem: (key, value) => {
      // Implement the functionality to set data in localStorage
      localStorage.setItem(key, value);
    },
  },
});
