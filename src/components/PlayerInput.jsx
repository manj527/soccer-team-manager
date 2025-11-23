import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';

export function PlayerInput({ onAddPlayers }) {
    const [input, setInput] = useState('');

    const handleParse = (target) => {
        if (!input.trim()) return;

        // Split by newlines, remove empty lines and whitespace
        // Also remove common list markers like "1.", "-", etc. if possible, 
        // but for now simple line splitting is safest for "poll results" which usually have names on new lines.
        const names = input
            .split(/\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0)
            // Optional: Filter out lines that look like poll metadata (e.g. "Select one", "10 votes")
            // For now, let's keep it simple and assume user pastes names.
            .map(name => name.replace(/^[\d-]+\.\s*/, '').replace(/^- \s*/, '')); // Remove "1. " or "- "

        onAddPlayers(names, target);
        setInput('');
    };

    return (
        <div className="card">
            <h2><UserPlus size={20} style={{ display: 'inline', marginRight: '8px' }} /> Add Guest Players</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Paste names of guest players below.
            </p>
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="1. Guest One&#10;2. Guest Two..."
                rows={4}
                style={{ marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-primary" onClick={() => handleParse('A')} style={{ flex: 1, backgroundColor: '#ef4444' }}>
                    Add to Team A
                </button>
                <button className="btn-primary" onClick={() => handleParse('B')} style={{ flex: 1, backgroundColor: '#3b82f6' }}>
                    Add to Team B
                </button>
            </div>
        </div>
    );
}
