const Leaderboard = require('../models/leaderboard.js');

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
    try {
        const topPlayers = await Leaderboard.find()
            .sort({ score: -1 })
            .limit(100);
        res.json(topPlayers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching leaderboard' });
    }
};
