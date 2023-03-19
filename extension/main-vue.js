import { createApp, h } from "/node_modules/vue/dist/vue.esm-browser.js";

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
        h('form', { id: 'objective-form' }, [
          h('label', { for: 'objective' }, 'Instruction'),
          h('br'),
          h('textarea', { id: 'objective' }),
          h('div', { class: 'row align-items-center' }, [
            h('button', { type: 'submit', id: 'submit', class: 'mr-s' }, 'Submit'),
            h('span', { id: 'loading', class: 'hidden' }),
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
            h('a', { href: '#', id: 'clear-history' }, 'Clear history'),
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