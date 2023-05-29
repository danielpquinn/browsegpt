import { createApp, h } from "/node_modules/vue/dist/vue.esm-browser.js";

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

const getLineById = (id, html) => {
  const el = html.split("\n").find((line) => {
    return line.replace(/^\s+/, "").startsWith(id);
  });
  return el || "";
};

// Render the current command history to the 'history' element
const renderHistory = () => {
  const historyEl = document.querySelector("#history");

  if (commandHistory.length === 0) {
    historyEl.innerHTML = "No command history";
  } else {
    historyEl.innerHTML = commandHistory
      .map(
        (command, index) =>
          `<div>
            <strong>Command ${index + 1}:</strong>
            <pre>${JSON.stringify(command, null, 2)}</pre>
          </div>`
      )
      .join("");
  }
};

// Remove all command history and re-render the 'history' element
const clearHistory = () => {
  commandHistory.length = 0;
  renderHistory();
};

const App = {
  name: 'App',
  data() {
    return {};
  },
  render() {
    return h('div', {}, [
      h('div', { id: 'header' }, [
        h('img', { alt: 'BrowseGPT', src: 'logo.png', width: '163' }),
      ]),
      h('div', { class: 'main' }, [
        h('form', { id: 'objective-form', onSubmit: async (e) => {
          e.preventDefault();

          // Show loading spinner and disable submit button
          document.getElementById('loading').classList.remove('hidden');
          document.getElementById('submit').disabled = true;
          
          const currentTab = await getCurrentTab();
        
          if (!currentTab) {
            errorEl.innerHTML =
              "BrowseGPT extension could not access a tab. Try closing and re-launching the extension.";
            // Hide loading spinner and enable submit button
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('submit').disabled = false;
            return;
          }
        
          const tabId = currentTab.id;
          let commandResponse = {};
        
          const objective = e.target.objective.value;
        
          try {
            /** @type BrowserContent */
            const browserContent = await chrome.tabs.sendMessage(tabId, {
              message: "get_browser_content",
            });

            // Display the received browser content HTML
            document.getElementById('html').innerHTML = browserContent.html;
        
            const { url, html } = browserContent;
        
            const previousSteps = commandHistory.map((c) => c.step);
        
            const body = JSON.stringify({
              version: "2.0",
              previousSteps,
              url: url.substring(0, 50),
              html,
              objective,
            });
        
            const res = await fetch("http://localhost:38888/command", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body,
            });
        
            commandResponse = await res.json();
            /** @type Command */
            const command = JSON.parse(commandResponse.command);

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
              console.error("Could not establish connection");
            } else {
              console.error(e);
            }
          } finally {
            // Hide loading spinner and enable submit button
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('submit').disabled = false;
          }
        }}, [
          h('label', { for: 'objective' }, 'Instruction'),
          h('br'),
          h('textarea', { id: 'objective' }),
          h('div', { class: 'row align-items-center' }, [
            h('button', { type: 'submit', id: 'submit', class: 'mr-s' }, 'Submit'),
            h('span', { id: 'loading', class: 'hidden' }, [
              h('img', { alt: 'Loading', src: 'loading.gif', width: '30' })
            ]),
          ]),
        ]),
        h('button', { id: 'debug-get-browser-content', class: 'hidden' }, 'Get browser content'),
        h('form', { id: 'debug-form', class: 'hidden' }, [
          h('input', { type: 'text', id: 'debug-id' }),
          h('input', { type: 'text', id: 'debug-action' }),
          h('input', { type: 'text', id: 'debug-value' }),
          h('button', { type: 'submit', id: 'debug-submit' }, 'Run'),
        ]),
        h('div', { id: 'error' }),
        h('div', { class: 'row' }, [
          h('div', { class: 'col' }, [
            h('h3', {}, 'History'),
          ]),
          h('div', { class: 'col text-right' }, [
            h('a', { href: '#', id: 'clear-history', onClick: (e) => {
              e.preventDefault();
              clearHistory();
            }}, 'Clear history'),
          ]),
        ]),
        h('div', { id: 'history' }),
        h('h3', {}, 'Current page HTML'),
        h('pre', { id: 'html' }),
      ]),
    ]);
  }
};

const app = createApp({
  render: () => h(App),
});

app.mount('#app');