import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async (req, res) => {
  if (req.method === 'POST') {
    const prompt = req.body.prompt

    // Check that the request body contains the required fields.
    if (!prompt ) {
      const errorMessage = '`prompt` is missing.'

      res.status(422).json({
        error: {
          message: errorMessage,
        }
      });
    }

    // Fetch new image from OpenAI.
    try {
      const response = await openai.createImage({
        prompt: generatePrompt(prompt),
        n: 1,
        size: "512x512"
      })

      const image_url = response.data.data[0].url

      res.status(200).json({url: image_url});

    } catch(error) {
      if (error.response.data.type === 'invalid_request_error') {
        // image generation blocked by safety prompt - generate a generic safe image.
        const response = await openai.createImage({
          prompt: generatePrompt('a yacht on the harbour with police boats nearby'),
          n: 1,
          size: "512x512"
        })

        const image_url = response.data.data[0].url

        res.status(200).json({url: image_url});
        return;
      }
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

function generatePrompt(description) {
  return `A safe black and white photograph of "${description}" taken with a film camera.`
}
