import fictioneersClient from 'utils/api-utils/fictioneers-client';

export default async (req, res) => {
  const userId = req.query.id;

  if (req.method === 'GET') {

    await fictioneersClient.setUserId({userId: userId});

    const timelineEvents = await fictioneersClient.getUserTimelineEvents()

    res.status(200).json({
      timelineEvents: userId// timelineEvents.data
    });
  } else {
    res.status(405).json({message: 'GET requests only.'});
  }
};
