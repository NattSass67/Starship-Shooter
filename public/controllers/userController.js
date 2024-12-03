const Leaderboard = require('../models/leaderboard.js');

// Set username
exports.setUsername = async (req, res) => {
    const { username } = req.body;

    if (!username || username.trim() === '') {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const user = await Leaderboard.create({ username });
        const userId = user._id;
        res.cookie('userId', userId.toString(), { httpOnly: true });
        res.json({ message: 'Username set successfully', userId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating user' });
    }
};

// Update score
exports.updateScore = async (req, res) => {
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

        if (score > user.score) {
            user.score = score;
            await user.save();
        }

        res.json({ message: 'Score updated', leaderboard: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating score' });
    }
};
