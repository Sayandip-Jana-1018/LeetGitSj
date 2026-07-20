document.addEventListener("DOMContentLoaded", () => {
  const backendUrlInput = document.getElementById("backendUrl");
  const extensionSecretInput = document.getElementById("extensionSecret");
  const saveBtn = document.getElementById("saveBtn");
  const statusDiv = document.getElementById("status");

  // Load existing settings
  chrome.storage.local.get(["backendUrl", "extensionSecret"], (result) => {
    if (result.backendUrl) {
      backendUrlInput.value = result.backendUrl;
    } else {
      // Default fallback
      backendUrlInput.value = "https://leetgit.vercel.app";
    }
    if (result.extensionSecret) {
      extensionSecretInput.value = result.extensionSecret;
    }
  });

  saveBtn.addEventListener("click", () => {
    const backendUrl = backendUrlInput.value.trim().replace(/\/$/, ""); // remove trailing slash
    const extensionSecret = extensionSecretInput.value.trim();

    chrome.storage.local.set({ backendUrl, extensionSecret }, () => {
      statusDiv.textContent = "Settings saved successfully!";
      statusDiv.className = "status success";
      setTimeout(() => {
        statusDiv.textContent = "";
      }, 3000);
    });
  });
});
