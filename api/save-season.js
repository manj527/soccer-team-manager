import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    const SEASONS_PREFIX = 'soccer_season:';
    const SEASONS_LIST_KEY = 'soccer_seasons_list';

    if (req.method === 'POST') {
        try {
            const data = req.body;
            if (!data.id) {
                data.id = `NJSC_${Date.now()}`;
            } else if (!data.id.startsWith('NJSC_')) {
                data.id = `NJSC_${data.id}`;
            }
            data.lastUpdated = new Date().toISOString();

            // Save season data
            await kv.set(`${SEASONS_PREFIX}${data.id}`, data);

            // Update list if new
            let seasonIds = await kv.get(SEASONS_LIST_KEY) || [];
            if (!seasonIds.includes(data.id)) {
                seasonIds.push(data.id);
                await kv.set(SEASONS_LIST_KEY, seasonIds);
            }

            return res.status(200).json({ success: true, id: data.id, message: 'Saved successfully' });
        } catch (error) {
            console.error('KV Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).end();
}
