const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

const getMessages = ({ previousSteps, url, html, objective }) => ([
  {
    role: "system",
    content:
      `You are an automation system that accepts simplified HTML for the current page and an objective. Based on the provided objective, you will first generate short summary of the page you're on, along with any details that are relevant to your objective. Then you'll provide a suggested action to take on the HTML to achieve the objective. Simplified HTML is provided in the format \`{id} {element} {text}\`, for example \`5 LINK Buy now\`. Available actions that you can take are CLICK, NAVIGATE and ENTER_TEXT. Your goal is to accomplish the objective in the fewest number of actions possible. The \`action\` in your response can only include \`id\`s for elements in the requests's \`html\` field. You can only ENTER_TEXT into an INPUT.`,
  },
  {
    role: "user",
    content: `{
"previousSteps": [],
"url": "https://cnn.com",
"html": "0 NAV
  1 LINK Finance
  2 LINK World
  3 LINK Politics
  4 LINK AD Airbnb",
"objective": "Book an place to stay in Seattle for February 22nd"
}`,
  },
  {
    role: "assistant",
    content: `{
  "reason": "No previous steps. This is the CNN home page with top stories. This page is not related to my goal of booking an Airbnb. Based on the objective, the next step is to navigate to Airbnb.com",
  "step": "Navigate to airbnb.com",
  "action": { "action": "NAVIGATE", "value": "https://airbnb.com" }
}`
  },
  {
    role: "user",
    content: `{
  "previousSteps": [ "Navigate to airbnb.com" ],
  "url": "https://airbnb.com",
  "html": "0 LINK Cabins
1 INPUT label=Search destinations, value=None
2 LINK Beachfront",
  "objective": "Book an AirBnB in Seattle for February 22nd"
}`
  },
  {
    role: "assistant",
    content: `{
  "reason": "Navigated to Airbnb.com. This is the Airbnb home page and no destination has been entered. Based on the objective, The next step is to search for Seattle listings",
  "step": "Search for Seattle listings",
  "action": { "action": "ENTER_TEXT", "id": 1, "value": "Seattle" }
}`
  },
  {
    role: "user",
    content: `{
  "previousSteps": [ "Navigate to airbnb.com", "Search for Seattle listings" ],
  "url": "https://airbnb.com/s/Seattle",
  "html": "0 BUTTON 22 Wednesday February 2023
1 INPUT label=Search destinations, value=Seattle",
  "objective": "Book an AirBnB in Seattle for February 22nd"
}`
  },
  {
    role: "assistant",
    content: `{
  "reason": "Navigated to Airbnb.com and searched for Seattle listings. This is the Airbnb listings page. Based on the objective, the next step is to specify a date",
  "step": "Specify check in date",
  "action": { "action": "CLICK", "id": 0 }
}`
  },
  {
    role: "user",
    content: `{
  "previousSteps": [],
  "url": "https://www.google.com/search?q=Bistro+Vida+Menlo+Park",
  "html": "0 MAIN
  1 HEADING Search Results
  2 LINK Bistro Vida HOME
3 BUTTON Reserve a table",
  "objective": "Make a reservation for 4 at bistro vida in Menlo Park at 7pm"
}`
  },
  {
    role: "assistant",
    content: `{
  "reason": "No previous steps were taken. This is the Google search results page. Based on the objective, the next step is to reserve a table",
  "step": "Click on the reservation link",
  "action": { "action": "CLICK", "id": 3 }
}`
  },
  {
    role: "user",
    content: `{
  "previousSteps": ${JSON.stringify(previousSteps)},
  "url": "${url}",
  "html": "${html}",
  "objective": "${objective}"
}`
  }
]);

module.exports.getCommand = async (input) => {
  console.log(`v${input?.version || "1.0"} ${input?.objective}`);

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: getMessages(input),
    });
    return completion.data.choices[0].message.content;
  } catch (e) {
    console.error(e);
    return JSON.stringify({
      id: "0",
      action: "CLICK",
      value: null,
      reason: "Could not get command",
    });
  }
};
