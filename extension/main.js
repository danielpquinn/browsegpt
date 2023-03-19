/**
 * @typedef BrowserContent
 * @type {object}
 * @property {string} url
 * @property {string} html
 */

/**
 * @typedef Action
 * @type {object}
 * @property {"CLICK" | "NAVIGATE" | "ENTER_TEXT"} action
 * @property {number} id
 * @property {string} value
 * @property {string} el
 */

/**
 * @typedef Command
 * @type {object}
 * @property {string} reason
 * @property {string} step
 * @property {Action} action
 */

const form = document.getElementById("objective-form");
const objectiveInput = document.getElementById("objective");
const submitButton = document.getElementById("submit");
const loadingEl = document.getElementById("loading");
const historyEl = document.getElementById("history");
const errorEl = document.getElementById("error");
const clearHistoryEl = document.getElementById("clear-history");
const pre = document.getElementById("html");

const debugGetBrowserContent = document.getElementById(
  "debug-get-browser-content"
);
const debugForm = document.getElementById("debug-form");
const debugId = document.getElementById("debug-id");
const debugAction = document.getElementById("debug-action");
const debugValue = document.getElementById("debug-value");

objectiveInput.focus();

/** @type Command[] */
const commandHistory = [];

const getCurrentTab = async () => {
  try {
    let [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: false,
    });
    return tab;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const renderHistory = () => {
  historyEl.innerHTML = "";
  for (const command of commandHistory) {
    const { action, reason } = command;
    const actionText = `${action.action} ${action.el} ${action.value || ""}`;
    const itemEl = document.createElement("p");
    itemEl.innerHTML = `<small><strong>${actionText}:</strong> ${reason}</small>`;
    historyEl.prepend(itemEl);
  }
  if (!commandHistory.length) {
    historyEl.innerHTML = "<small>No history. Enter an instruction above to get started.</small>"
  }
};

renderHistory();

debugGetBrowserContent.addEventListener("click", async (e) => {
  const currentTab = await getCurrentTab();
  const tabId = currentTab.id;
  /** @type BrowserContent */
  const browserContent = await chrome.tabs.sendMessage(tabId, {
    message: "get_browser_content",
  });
  const { html } = browserContent;
  pre.innerText = html;
});

debugForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const currentTab = await getCurrentTab();
  const tabId = currentTab.id;
  chrome.tabs.sendMessage(tabId, {
    message: "run_command",
    command: JSON.stringify({
      action: debugAction.value,
      value: debugValue.value,
      id: debugId.value,
    }),
  });
});

clearHistoryEl.addEventListener("click", async () => {
  commandHistory.splice(0, commandHistory.length);
  renderHistory();
  pre.innerHTML = "";
  errorEl.innerHTML = "";
  const currentTab = await getCurrentTab();
  chrome.tabs.sendMessage(currentTab.id, {
    message: "clear_history",
  });
});

const getLineById = (id, html) => {
  const el = html.split("\n").find((line) => {
    return line.replace(/^\s+/, "").startsWith(id);
  });
  return el || "";
};

objectiveInput.addEventListener("keydown", (e) => {
  if (e.which === 13 && !e.shiftKey) {
    if (!e.repeat) {
      const newEvent = new Event("submit", { cancelable: true });
      e.target.form.dispatchEvent(newEvent);
    }
    e.preventDefault();
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitButton.setAttribute("disabled", true);
  
  const currentTab = await getCurrentTab();

  if (!currentTab) {
    errorEl.innerHTML =
      "BrowseGPT extension could not access a tab. Try closing and re-launching the extension.";
    return;
  }

  const tabId = currentTab.id;
  errorEl.innerText = "";
  loadingEl.classList.remove("hidden");
  let commandResponse = {};

  const objective = objectiveInput.value;

  try {
    /** @type BrowserContent */
    const browserContent = await chrome.tabs.sendMessage(tabId, {
      message: "get_browser_content",
    });

    const { url, html } = browserContent;

    pre.innerText = html;

    const previousSteps = commandHistory.map((c) => c.step);

    const body = JSON.stringify({
      version: "2.0",
      previousSteps,
      url: url.substring(0, 50),
      html,
      objective,
    });

    const res = await fetch("http://localhost:3000/command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    commandResponse = await res.json();
    /** @type Command */
    const command = JSON.parse(commandResponse.command);

    command.action.el = getLineById(command.action.id, html).trim();

    commandHistory.push(command);
    if (commandHistory.length > 5) {
      commandHistory.shift();
    }
    renderHistory();

    chrome.tabs.sendMessage(tabId, {
      message: "run_command",
      command: commandResponse.command,
    });
  } catch (e) {
    if (e.message.includes("Could not establish connection")) {
      errorEl.innerText =
        "This page doesn't allow the BrowseGPT extension. Close the extension, go to a different URL like https://google.com, and then re-launch the extension from there.";
    } else {
      errorEl.innerText = `Command: ${JSON.stringify(
        commandResponse || ""
      )}\n Error: ${e.message}. Try closing and re-launching the extension.`;
    }
  } finally {
    loadingEl.classList.add("hidden");
    submitButton.removeAttribute("disabled");
  }
});
