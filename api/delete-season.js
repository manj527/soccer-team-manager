import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    const SEASONS_PREFIX = 'soccer_season:';
    const SEASONS_LIST_KEY = 'soccer_seasons_list';

    if (req.method === 'POST') {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                return res.status(400).json({ error: 'ids array required' });
            }

            let deleted = 0;
            let seasonIds = await kv.get(SEASONS_LIST_KEY) || [];

            for (const id of ids) {
                await kv.del(`${SEASONS_PREFIX}${id}`);
                seasonIds = seasonIds.filter(sid => sid !== id);
                deleted++;
            }

            await kv.set(SEASONS_LIST_KEY, seasonIds);

            return res.status(200).json({ success: true, deleted });
        } catch (error) {
            console.error('KV Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).end();
}
