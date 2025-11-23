import React from 'react';
import { X, ArrowRight, ArrowLeft, UserMinus } from 'lucide-react';

export function PlayerCard({ id, name, location, onMove, onRemove }) {
    return (
        <div className="player-card">
            <span className="player-name">{name}</span>

            <div className="player-actions">
                {location === 'unassigned' && (
                    <>
                        <button
                            onClick={() => onMove(id, 'teamA')}
                            className="action-btn btn-team-a"
                            title="Move to Team A"
                        >
                            A
                        </button>
                        <button
                            onClick={() => onMove(id, 'teamB')}
                            className="action-btn btn-team-b"
                            title="Move to Team B"
                        >
                            B
                        </button>
                        <button onClick={() => onRemove(id)} className="remove-btn" title="Remove">
                            <X size={16} />
                        </button>
                    </>
                )}

                {location === 'teamA' && (
                    <>
                        <button
                            onClick={() => onMove(id, 'unassigned')}
                            className="action-btn btn-neutral"
                            title="Remove from Team"
                        >
                            <UserMinus size={14} />
                        </button>
                        <button
                            onClick={() => onMove(id, 'teamB')}
                            className="action-btn btn-team-b"
                            title="Switch to Team B"
                        >
                            <ArrowRight size={14} />
                        </button>
                    </>
                )}

                {location === 'teamB' && (
                    <>
                        <button
                            onClick={() => onMove(id, 'teamA')}
                            className="action-btn btn-team-a"
                            title="Switch to Team A"
                        >
                            <ArrowLeft size={14} />
                        </button>
                        <button
                            onClick={() => onMove(id, 'unassigned')}
                            className="action-btn btn-neutral"
                            title="Remove from Team"
                        >
                            <UserMinus size={14} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
