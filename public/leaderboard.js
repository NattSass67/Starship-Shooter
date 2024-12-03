const mongoose = require('mongoose');
require('dotenv').config();

console.log(process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

  const LeaderboardSchema = new mongoose.Schema({
    username: { type: String, required: true },
    score: { type: Number, default: 0 },
});

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);