
# BrowseGPT

https://browsegpt.ai

Chrome extension to automate your browser with artificial intelligence.

## Local development setup instructions

Start by installing Vue in the /extension folder
```bash
cd extension
npm install
```

Go to chrome://extensions in your browser, then click "Load unpacked". Select the /extension folder.

The next step is to add your OpenAI API key to your environment.
```bash
export OPENAI_KEY=<your key>
```

To run the Node.js server that sends requests to the OpenAI API:

```bash
cd server
node app.js
```

At this point you should be able to launch the Chrome extension in your browser and start testing.
