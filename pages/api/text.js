import axios from 'axios';

export default async (req, res) => {
  // const response = await axios.post('https://external-api.com/text');
  // const text = response.data;

  // Get the users ID from the request.
  // Get the users context from the request.

  // ? Fetch the users story state from Fictioneers

  // await: Attempt to progress the users story, return new story context

  // Amend the existing context, adding new story context.

  // await: Make a request to ChatGPT with the context to generate the content of the story.

  // return new story content & context.



  const text = {text: 'Hello World!'};
  res.status(200).json({ text });
};
