chrome.action.onClicked.addListener((tab) => {
  chrome.windows.create({
    url: chrome.runtime.getURL(`index.html`),
    width: 600,
    height: 600,
    type: "popup",
  });
});
