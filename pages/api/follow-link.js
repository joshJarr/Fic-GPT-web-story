import Fictioneers from 'fictioneers';

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

      res.status(200).json({data: currentEventData});
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

      res.status(200).json({data: currentEventData});
    }
  } else {
    res.status(405).json({message: 'POST requests only.'});
  }
};
