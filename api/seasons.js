import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
    const SEASONS_PREFIX = 'soccer_season:';
    const SEASONS_LIST_KEY = 'soccer_seasons_list';

    if (req.method === 'GET') {
        try {
            let seasonIds = await redis.get(SEASONS_LIST_KEY);

            // Seed if empty
            if (!seasonIds) {
                const dataPath = path.resolve('data/seasons');
                if (fs.existsSync(dataPath)) {
                    console.log('Seeding seasons from files...');
                    const files = fs.readdirSync(dataPath).filter(f => f.endsWith('.json'));
                    const seasons = files.map(file => {
                        const content = fs.readFileSync(path.join(dataPath, file), 'utf-8');
                        return JSON.parse(content);
                    });

                    seasonIds = seasons.map(s => s.id);
                    await redis.set(SEASONS_LIST_KEY, seasonIds);

                    for (const season of seasons) {
                        await redis.set(`${SEASONS_PREFIX}${season.id}`, season);
                    }
                } else {
                    seasonIds = [];
                }
            }

            if (seasonIds.length === 0) {
                return res.status(200).json([]);
            }

            // Fetch all seasons
            const seasons = [];
            for (const id of seasonIds) {
                const season = await redis.get(`${SEASONS_PREFIX}${id}`);
                if (season) seasons.push(season);
            }

            // Sort by lastUpdated descending
            seasons.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));

            return res.status(200).json(seasons);
        } catch (error) {
            console.error('Redis Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).end();
}
