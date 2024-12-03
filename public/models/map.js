const mongoose = require('mongoose');

const MapSchema = new mongoose.Schema({
    mapName: { type: Number, required: true },
    entities: [
        {
            type: { type: String, required: true },
            sprite: { type: String, required: true },
            x: { type: Number, required: true },
            y: { type: Number, required: true },
            sizeX: { type: Number, required: true },
            sizeY: { type: Number, required: true },
            health: { type: Number, required: true },
            attackPeriod: { type: Number, required: true },
            attackStyle: { type: String, required: true },
        }
    ]
});

module.exports = mongoose.model('Map', MapSchema);
