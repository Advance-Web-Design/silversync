

import express from 'express';
import { addUser, record_game_session, verifyUser } from './firebaseLogic.js'; // move logic to a separate file

const router = express.Router();

router.post('/addUser', async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const userId = await addUser(username, password, email);
    res.json({ userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recordGameSession', async (req, res) => {
  try {
    const gameId = await record_game_session(...Object.values(req.body));
    res.json({ gameId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verifyUser', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userId = await verifyUser(username, password);
    res.json({ userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;