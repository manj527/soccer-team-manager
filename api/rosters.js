import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    const ROSTER_KEY = 'soccer_rosters';

    if (req.method === 'GET') {
        try {
            let data = await kv.get(ROSTER_KEY);

            // Seed if empty
            if (!data) {
                const rostersPath = path.resolve('data/rosters.json');
                if (fs.existsSync(rostersPath)) {
                    console.log('Seeding rosters from file...');
                    const content = fs.readFileSync(rostersPath, 'utf-8');
                    data = JSON.parse(content);
                    await kv.set(ROSTER_KEY, data);
                } else {
                    data = { players: [], communityFund: 0 };
                }
            }

            return res.status(200).json(data);
        } catch (error) {
            console.error('KV Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    if (req.method === 'POST') {
        try {
            const data = req.body;
            await kv.set(ROSTER_KEY, data);
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).end();
}
