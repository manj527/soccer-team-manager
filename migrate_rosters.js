import fs from 'fs';
import path from 'path';

const rostersPath = path.resolve('data/rosters.json');

if (fs.existsSync(rostersPath)) {
    const data = JSON.parse(fs.readFileSync(rostersPath, 'utf-8'));
    const players = [];
    let communityFund = 0;

    if (!data.players) {
        // Need migration
        const allLists = [
            ...(data.saturday || []).map(p => ({ ...p, type: 'saturday' })),
            ...(data.wednesday || []).map(p => ({ ...p, type: 'wednesday' })),
            ...(data.guests || []).map(p => ({ ...p, type: 'guest' }))
        ];

        allLists.forEach(p => {
            const existing = players.find(x => x.name.toLowerCase().trim() === p.name.toLowerCase().trim());
            if (existing) {
                if (!existing.types.includes(p.type)) {
                    existing.types.push(p.type);
                }
            } else {
                players.push({
                    id: p.id,
                    name: p.name.trim(),
                    types: [p.type],
                    pairedWith: p.pairedWith || null
                });
            }
        });

        fs.writeFileSync(rostersPath, JSON.stringify({ players, communityFund }, null, 2));
        console.log('Migration successful. ' + players.length + ' unique players found.');
    } else {
        console.log('Already migrated.');
    }
} else {
    console.log('No rosters.json found.');
}
