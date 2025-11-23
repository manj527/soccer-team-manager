import React, { useState } from 'react';
import { Share2, Copy, Check, Camera } from 'lucide-react';
import { PublishedView } from './PublishedView';
import './PublishedView.css';

export function ShareSection({ teamA, teamB, colorA, colorB, nameA, nameB, iconA, iconB }) {
    const [instructions, setInstructions] = useState('Be on time. Kick off at 6:15 AM. Play hard and be fair to all.');
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const generateText = () => {
        let text = `⚽ *Match Teams* ⚽\n\n`;

        if (instructions.trim()) {
            text += `📝 *Instructions:*\n${instructions}\n\n`;
        }

        text += `🔴 *${nameA}*:\n`;
        if (teamA.length === 0) text += `(Empty)\n`;
        teamA.forEach((p, i) => {
            text += `${i + 1}. ${p.name}\n`;
        });

        text += `\n🔵 *${nameB}*:\n`;
        if (teamB.length === 0) text += `(Empty)\n`;
        teamB.forEach((p, i) => {
            text += `${i + 1}. ${p.name}\n`;
        });

        return text;
    };

    const handleShare = () => {
        const text = generateText();
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleCopy = () => {
        const text = generateText();
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <>
            <div className="card">
                <h2><Share2 size={20} style={{ display: 'inline', marginRight: '8px' }} /> Finalize & Share</h2>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Custom Instructions (Time, Venue, etc.)
                    </label>
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="e.g. Kickoff at 8PM @ Central Park. Bring white/black shirts."
                        rows={3}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <button className="btn-primary" onClick={() => setShowPreview(true)} style={{ backgroundColor: '#8b5cf6' }}>
                        <Camera size={18} /> Preview for Screenshot
                    </button>

                    <button className="btn-primary" onClick={handleShare} style={{ backgroundColor: '#25D366' }}>
                        <Share2 size={18} /> Share to WhatsApp
                    </button>

                    <button className="btn-secondary" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        {copied ? <Check size={18} color="var(--success)" /> : <Copy size={18} />}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                </div>
            </div>

            {showPreview && (
                <PublishedView
                    teamA={teamA}
                    teamB={teamB}
                    colorA={colorA}
                    colorB={colorB}
                    nameA={nameA}
                    nameB={nameB}
                    iconA={iconA}
                    iconB={iconB}
                    instructions={instructions}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </>
    );
}
