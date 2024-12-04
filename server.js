const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const Leaderboard = require('./public/models/leaderboard.js');
const leaderboard = require('./public/models/leaderboard.js');

const app = express();
const PORT = 3000;

app.use(express.json()); // To parse JSON bodies
app.use(cookieParser()); // To parse cookies
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check for a user cookie and redirect if necessary
app.use(async (req, res, next) => {
    if (!req.cookies.userId) {
        req.needsUsername = true; // Flag for requiring username
    } else {
        const user = await leaderboard.findById(req.cookies.userId);

        if (!user) {
            req.needsUsername = true; 
        }
        else{
            req.userId = req.cookies.userId; 
        }
       // req.userId = req.cookies.userId; // Attach the userId from the cookie
    }
    next();
});

app.use('/api/leaderboard', require('./public/routes/leaderboardRoute.js'));
app.use('/api/map', require('./public/routes/mapRoute.js'));
app.use('/api/user', require('./public/routes/userRoute.js'));

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
