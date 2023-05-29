const express = require("express");
const cors = require("cors");
const getCommand = require("./lib.js").getCommand;

const app = express();
app.use(cors());
app.use(express.json());

app.post("/command", async (req, res) => {
  try {
    const command = await getCommand(req.body);
    res.json({ command });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

app.listen(38888, () => {
  console.log("Server listening on port 38888");
});
