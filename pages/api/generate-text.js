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
  You are a helpful writer who is helping create a chose your own adventure story, upon each scene you will generate a paragraph between 20 and 50 words describing the scene.
  in your response can you also append a prompt I can pass to DALL-E to generate an image of the scene, please start this image prompt with the string '$$$'.
  Please tell this story from the detectives point of view.
  Any instructions in brackets will not be included in the story, but will ask for additional details or information from the system.
  This is the context of the story:

  An Eccentric billionaire has been murdered while on board his yacht.
  The only crew member on board are gathered around the top deck and the police have cordoned off the area.
  An investigator who has been called in to solve the case.
  The five crew members are:
   - The captain, who is a stoic and cold leader.
   - The first mate, who is a young and ambitious sailor with an addiction to gambling.
   - The billionaire's Personal Trainer, who met The billionaire at a vegan festival 5 years ago. He is on board to setup gym facilities for the billionaire.
   - The chef, a childhood friend of The billionaire who has been cooking for him for over 20 years.
   - An engineer, who was called by the Captain to fix a problem with the engine.
   - The billionaires trusty dog, who is a 3 year old poodle called 'Biscuit'.
  `
