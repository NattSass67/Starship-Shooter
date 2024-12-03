const Leaderboard = require('./public/leaderboard');
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
app.post('/api/set-username', async (req, res) => {
    const { username } = req.body;

    if (!username || username.trim() === '') {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        // Create the user in the database
        const user = await Leaderboard.create({ username });
        const userId = user._id; // Use MongoDB's generated ID

        // Set the ID in the user's cookie
        res.cookie('userId', userId.toString(), { httpOnly: true });

        res.json({ message: 'Username set successfully', userId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating user' });
    }
});


// API to update the user's score
app.post('/api/score', async (req, res) => {
    const { score } = req.body;
    const userId = req.cookies.userId;

    if (!userId) {
        return res.status(400).json({ error: 'User not identified' });
    }

    try {
        const user = await Leaderboard.findById(userId);

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Update only if the new score is higher
        if (score > user.score) {
            user.score = score;
            await user.save();
        }

        res.json({ message: 'Score updated', leaderboard: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating score' });
    }
});



// API to get the leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const topPlayers = await Leaderboard.find()
            .sort({ score: -1 })
            .limit(10);

        res.json(topPlayers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching leaderboard' });
    }
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

app.get('/leaderboard', (req, res) => {
        res.sendFile(path.join(__dirname, 'pages/leaderboard.html')); // Serve the game
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
