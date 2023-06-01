// import axios from 'axios';

export default async (req, res) => {
  console.log(req);

  if (req.method === 'POST') {
    res.status(200).json({user: '4321'});
  } else {
    res.status(405).json({message: 'POST requests only.'});
  }
};
