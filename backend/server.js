import express from 'express';
import { PrismaClient } from '@prisma/client';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Middleware pour la gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Auth routes (signup, login)
app.post('/signup', async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, username },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (user && await bcrypt.compare(password, user.password)) {
      res.json(user);
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Messages routes
app.post('/messages', async (req, res) => {
  const { content, senderId, receiverId } = req.body;
  try {
    const message = await prisma.message.create({
      data: { content, senderId, receiverId },
    });
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/messages', async (req, res) => {
  try {
    const messages = await prisma.message.findMany();
    res.json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Friends routes
app.post('/add-friend', async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    const friend = await prisma.friend.create({
      data: { userId, friendId },
    });
    res.json(friend);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/friends/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const friends = await prisma.friend.findMany({
      where: { userId },
    });
    res.json(friends);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Matches routes
app.post('/match', async (req, res) => {
  const { userId, matchId } = req.body;
  try {
    const match = await prisma.match.create({
      data: { userId, matchId, status: 'pending' },
    });
    res.json(match);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/matches/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userId },
          { matchId: userId }
        ]
      },
      include: {
        user: true,
        match: true
      }
    });
    res.json(matches);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
