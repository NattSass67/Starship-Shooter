const Map = require('../models/map.js');

// Get a specific map
exports.getMap = async (req, res) => {
    try {
        const { mapName } = req.params;
        
        const map = await Map.findOne({ mapName:parseInt(mapName) });

        if (!map) {
            return res.status(404).json({ error: 'Map not found' });
        }
        res.json(map);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching map data' });
    }
};
