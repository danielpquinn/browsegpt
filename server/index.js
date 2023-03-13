const getCommand = require("./lib.js").getCommand;

module.exports.handler = async (event) => {
  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(""),
  };

  try {
    const command = await getCommand(JSON.parse(event.body));
    response.body = JSON.stringify({ command });
  } catch (error) {
    console.error(error.message);
    response.statusCode = 500;
    response.body = JSON.stringify("Something went wrong");
  }
  return response;
};
