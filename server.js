const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(express.json()); // To parse JSON bodies
app.use(cookieParser()); // To parse cookies
app.use(express.static(path.join(__dirname, 'public')));

const leaderboard = {}; // In-memory leaderboard

// Middleware to check for a user cookie and redirect if necessary
app.use((req, res, next) => {
    if (!req.cookies.userId) {
        req.needsUsername = true; // Flag for requiring username
    } else {
        req.userId = req.cookies.userId; // Attach the userId from the cookie
    }
    next();
});

// API to set username and create a user cookie
app.post('/api/set-username', (req, res) => {
    const { username } = req.body;

    if (!username || username.trim() === '') {
        return res.status(400).json({ error: 'Username is required' });
    }

    // Generate a unique userId and set it as a cookie
    const userId = crypto.randomUUID();
    res.cookie('userId', userId, { httpOnly: true });

    // Initialize the user in the leaderboard
    leaderboard[userId] = { username, score: 0 };

    res.json({ message: 'Username set successfully', userId });
});

// API to update the user's score
app.post('/api/score', (req, res) => {
    const { score } = req.body;
    const userId = req.userId;

    if (!userId) {
        return res.status(400).json({ error: 'User not identified' });
    }

    if (!leaderboard[userId]) {
        return res.status(400).json({ error: 'User not found' });
    }

    leaderboard[userId].score += score;

    res.json({ message: 'Score updated', leaderboard });
});

// API to get the leaderboard
app.get('/api/leaderboard', (req, res) => {
    const sortedLeaderboard = Object.values(leaderboard)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Return the top 10 players
    res.json(sortedLeaderboard);
});

// Serve the main game or username form depending on the cookie
app.get('/', (req, res) => {
    if (req.needsUsername) {
        res.sendFile(path.join(__dirname, 'pages/username.html')); // Serve username form
    } else {
        res.sendFile(path.join(__dirname, 'pages/index.html')); // Serve the game
    }
});

// Serve the main game or username form depending on the cookie
app.get('/game', (req, res) => {
    if (req.needsUsername) {
        res.sendFile(path.join(__dirname, 'pages/username.html')); // Serve username form
    } else {
        res.sendFile(path.join(__dirname, 'pages/game.html')); // Serve the game
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
