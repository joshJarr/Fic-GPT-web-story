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

    const fictioneersClient = new Fictioneers({
      apiKey: process.env.FIC_API_KEY,
      userId: userId
    });

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

      } catch (error) {
        console.error('Oh we cant create a user, how odd!', error)
      }
    }

    const response = linkToFollow && currentTimelineEvent
      ? await fictioneersClient.followLinkUserTimelineEvent({linkId: linkToFollow, timelineEventId: currentTimelineEvent})
      : await fictioneersClient.getUserTimelineEvents()

    const allTimelineEvents = linkToFollow && currentTimelineEvent
      ? response.meta.changed_timeline_events
      : response.data

      const newTimelineEvent = allTimelineEvents.find(obj => obj.state === 'ACTIVE');

      const newEventData = {
        id: newTimelineEvent.id,
        state: newTimelineEvent.state,
        links: newTimelineEvent.links,
        narrative_event_id: newTimelineEvent.narrative_event_id,
        narrative_event_title: newTimelineEvent.narrative_event_title,
        narrative_event_description: newTimelineEvent.narrative_event_description,
      }

      res.status(200).json({event: newEventData});
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
