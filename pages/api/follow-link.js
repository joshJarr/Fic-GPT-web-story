import Fictioneers from 'fictioneers';
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async (req, res) => {
  if (req.method === 'POST') {

    const userId = req.body.user;
    const linkToFollow = req.body.linkToFollow;
    const isNewUser = req.body.isNewUser;
    const currentTimelineEvent = req.body.currentTimelineEvent;
    const context = req.body.context

    const fictioneersClient = new Fictioneers({
      apiKey: process.env.FIC_API_KEY,
      userId: userId
    });

    // Probably not needed, but just in case.
    fictioneersClient.setUserId({userId});

    if (!userId) {
      throw new Error('No user ID provided.')
    }

    // If there's a user ID without an event, then we need to create a new user.
    if (isNewUser) {
      try {
        await fictioneersClient.createUser({
          timelineId: process.env.FIC_TIMELINE_ID,
          disableTimeGuards: false,
          pauseAtBeats: false
        })
        // Have a lil nap, if we start asking for timeline events too quickly it breaks!
        // await timeout(4000);
      } catch (error) {
        console.log('Oh we cant create a user, how odd!', error)
      }
    }

    if (linkToFollow && currentTimelineEvent) {
      const response = await fictioneersClient.followLinkUserTimelineEvent({linkId: linkToFollow, timelineEventId: currentTimelineEvent});

      const allChangedTimelineEvents = response.meta.changed_timeline_events;
      const newCurrentTimelineEvent = allChangedTimelineEvents.find(obj => obj.state === 'ACTIVE');

      const currentEventData = {
        id: newCurrentTimelineEvent.id,
        state: newCurrentTimelineEvent.state,
        links: newCurrentTimelineEvent.links,
        narrative_event_id: newCurrentTimelineEvent.narrative_event_id,
        narrative_event_title: newCurrentTimelineEvent.narrative_event_title,
        narrative_event_description: newCurrentTimelineEvent.narrative_event_description,
      }

      // Fetch the narrative event content from OpenAI.
      try {
        const completion = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: generatePrompt(currentEventData.narrative_event_description, context),
          temperature: 0.6,
          max_tokens: 1024,
        });

        currentEventData.narrative_event_content = completion.data.choices[0].text;
        console.log('=========txt=========', completion)

        res.status(200).json({data: currentEventData});
      } catch(error) {
        // Consider adjusting the error handling logic for your use case
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

      // Fetch this users current events.
      const timelineEvents = await fictioneersClient.getUserTimelineEvents();

      const allTimelineEvents = timelineEvents.data;
      const currentTimelineEvent = allTimelineEvents.find(obj => obj.state === 'ACTIVE');

      const currentEventData = {
        id: currentTimelineEvent.id,
        state: currentTimelineEvent.state,
        links: currentTimelineEvent.links,
        narrative_event_id: currentTimelineEvent.narrative_event_id,
        narrative_event_title: currentTimelineEvent.narrative_event_title,
        narrative_event_description: currentTimelineEvent.narrative_event_description,
      }




      // Fetch the narrative event content from OpenAI.
      try {
        const completion = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: generatePrompt(currentEventData.narrative_event_description, context),
          temperature: 0.6,
          max_tokens: 1024,
        });

        currentEventData.narrative_event_content = completion.data.choices[0].text;

        console.log('=========txt=========', completion.data.choices)
        res.status(200).json({data: currentEventData});
      } catch(error) {
        // Consider adjusting the error handling logic for your use case
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
    }
  } else {
    res.status(405).json({message: 'POST requests only.'});
  }
};

function generatePrompt(description, context) {
  return `
  Eccentric billionaire Richard Pembroke has been murdered while on board his yacht.
  The only crew member on board are gathered around the top deck and the police have cordoned off the area.
  You play the part of an investigator who has been called in to solve the case.
  The five crew members are:
   - The captain, who is a stoic and cold leader.
   - The first mate, who is a young and ambitious sailor with an addiction to gambling.
   - Mr Pembroke's Personal Trainer, who met Mr Pembroke at a vegan festival 5 years ago. He is on board to setup gym facilities for the billionaire.
   - The chef, a childhood friend of Mr Pembroke who has been cooking for him for over 20 years.
   - An engineer, who was called by the Captain to fix a problem with the engine.
   Finally Mr Pembrokes trusty dog, who is a 3 year old poodle called 'Biscuit'.

  Could you write a 20 word sentence following on from my story in where ${description}?

  The story so far is this:
  ${context}`;
}
