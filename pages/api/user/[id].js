import axios from 'axios';

export default async (req, res) => {
  const id = req.query.id;
  console.log(id);

  if (req.method === 'GET') {
    res.status(200).json({user: id});
  } else {
    res.status(405).json({message: 'GET requests only.'});
  }
};
