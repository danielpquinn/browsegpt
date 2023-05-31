import { createApp, h } from "/node_modules/vue/dist/vue.esm-browser.js";

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

const App = {
  name: 'App',
  data() {
    return {
      commandHistory: [],
    };
  },
  render() {
    let commandHistoryMarkup;

    if (this.commandHistory.length) {
      commandHistoryMarkup = this.commandHistory.map((command) => {
        const { action, reason } = command;
        const actionText = `${action.action} ${action.el} ${action.value || ""}`;
        return h('p', {}, [
          h('small', {}, [
            h('strong', {}, actionText),
            h('span', {}, reason),
          ])
        ]);
      });
    } else {
      commandHistoryMarkup = h('small', {}, 'No history. Enter an instruction above to get started.');
    }

    return h('div', {}, [
      h('div', { id: 'header' }, [
        h('img', { alt: 'BrowseGPT', src: 'logo.png', width: '163' }),
      ]),
      h('div', { class: 'main' }, [
        h('form', { id: 'objective-form', onSubmit: async (e) => {
          e.preventDefault();
          // submitButton.setAttribute("disabled", true);
          
          const currentTab = await getCurrentTab();

          document.getElementById('loading').classList.remove('hidden');
          document.getElementById('submit').disabled = false;
        
          if (!currentTab) {
            // errorEl.innerHTML =
            //   "BrowseGPT extension could not access a tab. Try closing and re-launching the extension.";
            return;
          }
        
          const tabId = currentTab.id;
          // errorEl.innerText = "";
          // loadingEl.classList.remove("hidden");
          let commandResponse = {};
        
          // const objective = objectiveInput.value;
          const objective = e.target.objective.value;

          try {
            /** @type BrowserContent */
            const browserContent = await chrome.tabs.sendMessage(tabId, {
              message: "get_browser_content",
            });
        
            const { url, html } = browserContent;
        
            // pre.innerText = html;
        
            const previousSteps = this.commandHistory.map((c) => c.step);
        
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
        
            this.commandHistory.push(command);
            if (this.commandHistory.length > 5) {
              this.commandHistory.shift();
            }

            // renderHistory();
        
            chrome.tabs.sendMessage(tabId, {
              message: "run_command",
              command: commandResponse.command,
            });
          } catch (e) {
            if (e.message.includes("Could not establish connection")) {
              // errorEl.innerText =
              //   "This page doesn't allow the BrowseGPT extension. Close the extension, go to a different URL like https://google.com, and then re-launch the extension from there.";
            } else {
              // errorEl.innerText = `Command: ${JSON.stringify(
              //   commandResponse || ""
              // )}\n Error: ${e.message}. Try closing and re-launching the extension.`;
            }
          } finally {
              document.getElementById('loading').classList.add('hidden');
              document.getElementById('submit').disabled = false;
          }
        }}, [
          h('label', { for: 'objective' }, 'Instruction'),
          h('br'),
          h('textarea', { id: 'objective' }),
          h('div', { class: 'row align-items-center' }, [
            h('div', { class: 'row align-items-center' }, [
              h('button', { type: 'submit', id: 'submit', class: 'mr-s', onClick: async (e) => {
                }, 
              }, 'Submit'),
              h('span', { id: 'loading', class: 'hidden' }),
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
            h('a', { href: '#', id: 'clear-history', onClick: async (e) => {
                e.preventDefault();
                this.commandHistory = [];
              },
            }, 'Clear history'),
          ]),
        ]),
        h('div', {}, commandHistoryMarkup),
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