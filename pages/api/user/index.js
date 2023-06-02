import fictioneersClient from 'utils/api-utils/fictioneers-client';

export default async (req, res) => {
  if (req.method === 'POST') {

    const newUserId = req.body.id;

    fictioneersClient.setUserId({userId: newUserId});

    const ficUser = await fictioneersClient.createUser({
      timelineId: process.env.FIC_TIMELINE_ID,
      disableTimeGuards: false,
      pauseAtBeats: true
    })

    const user = ficUser.data.id
    res.status(200).json({user: ficUser.data});
  } else {
    res.status(405).json({message: 'POST requests only.'});
  }
};
