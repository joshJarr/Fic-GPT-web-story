import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async (req, res) => {
  if (req.method === 'POST') {
    const story = req.body.story;

    if (!story) {
      throw new Error('No story provided.')
      res.status(400).json({message: 'No story provided.'});
    }

    // Fetch the content from OpenAI.
    try {
      const completion = await openai.createCompletion({
        max_tokens: 1024,
        model: "text-davinci-003",
        prompt: generatePrompt(story),
      });

      const summary = completion.data.choices[0].text;
      res.status(200).json({summary});

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

const generatePrompt = (story) => `
  Summaries the key plot points in this story so far in as few words as possible while retaining detail and accuracy.
  Please keep this summary under 300 words.

  Then reiterate the last two points in the story so it can continue on from there.

  Story summary:
  ${story}

`
