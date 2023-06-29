import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async (req, res) => {
  if (req.method === 'POST') {
    const messages = req.body.messages || [];
    const prompt = req.body.prompt;


    // Put the first prompt in the message history.
    messages.unshift({
      role: "system",
      content: firstPrompt,
    });

    // Add the latest user message to the message history.
    messages.push({
      role: "user",
      content: `${prompt} (please remember to include $$$ followed by an image prompt for the scene)`
    });

    // Fetch the content from OpenAI.
    try {
      const completion = await openai.createChatCompletion({
        max_tokens: 1024,
        model: "gpt-3.5-turbo",
        messages,
      });

      const message = completion.data.choices[0].message.content.split('$$$')[0];
      const imagePrompt = completion.data.choices[0].message.content.split('$$$')[1];
      res.status(200).json({message, imagePrompt});

    } catch(error) {
      if (error.response) {
        console.error(error.response.status, error.response.data);
        res.status(error.response.status).json(error.response.data);
      } else {
        console.error(`Error with OpenAI API request: ${error.message}`);
        res.status(500).json({
          error: {
            message: 'An error occurred during your request.',
          }
        });
      }
    }
  } else {
    res.status(405).json({message: 'POST requests only.'});
  }
};

const firstPrompt = `
  You must preform the following two tasks:

  1. You are a crime noir fiction writer assisting with a generative story. A scene will be described and you must write a short paragraph about this scene that follows on from the last. The paragraph must be kept short, ideally between 20 and 100 words. A scene description should include detail about the scene and the characters in it. Please do not repeat a scene with the same description, but build on the previous description adding something new. The scene description must not be empty. Information in brackets (like this) are instructions to the writer and should not be included in the scene description. Please write a description of the scene and only the scene. Do not add additional information or detail outside of the scene described.

  2. After completing the paragraph, you must write a short visual description that will be used as a prompt to generate an image using DALLE, this prompt must start with the string '$$$'.

  Here is an example response:
  "The scene description goes here and can be up to 50 words, it must not be empty.
  $$$ the visual prompt for the scene will go here."

  The following is the information about the entire story:
  On a luxurious yacht, an eccentric billionaire has been found murdered, sparking an intense investigation. As the police cordon off the top deck, the only crew members present become the focus of scrutiny. The team consists of:

  - The Captain: A stoic and dedicated leader with five years of service on the vessel.
  - The First Mate: An ambitious sailor known for his gambling habits.
  - The Billionaire's Personal Trainer: Hired to set up the billionaire's onboard gym facilities.
  - The Chef: A childhood friend of the billionaire, responsible for cooking for him for over two decades.
  - The Engineer: Summoned by the Captain to address an engine problem on the yacht.
  - The Billionaire's Trusty Dog: Biscuit, a three-year-old poodle who has been the billionaire's constant companion.

  In this intriguing scenario, suspicions arise, motives are questioned, and secrets await discovery. The Inspector must navigate the complex web of clues and interactions to solve the perplexing murder on the yacht.
  `
