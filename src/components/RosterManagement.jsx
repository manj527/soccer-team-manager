import React, { useState, useEffect } from 'react';
import { Users, Save, Plus, X, List } from 'lucide-react';

export function RosterManagement() {
    const [rosterData, setRosterData] = useState({
        players: [],
        communityFund: 0
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [newPlayerName, setNewPlayerName] = useState('');
    const [activeList, setActiveList] = useState('saturday');

    useEffect(() => {
        fetchRosters();
    }, []);

    const fetchRosters = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/rosters');
            if (!res.ok) throw new Error('Failed to fetch rosters');
            const data = await res.json();
            setRosterData({
                players: data.players || [],
                communityFund: data.communityFund || 0
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const saveRosters = async (newRosterData) => {
        setSaving(true);
        try {
            const res = await fetch('/api/rosters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRosterData)
            });
            if (!res.ok) throw new Error('Failed to save rosters');
            // Show short success indication?
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAddPlayer = (e) => {
        e.preventDefault();
        const trimmed = newPlayerName.trim();
        if (!trimmed) return;

        let newPlayers = [...rosterData.players];
        const existingIndex = newPlayers.findIndex(p => p.name.toLowerCase() === trimmed.toLowerCase());

        if (existingIndex >= 0) {
            // Player exists, add tag if needed
            if (!newPlayers[existingIndex].types.includes(activeList)) {
                newPlayers[existingIndex] = {
                    ...newPlayers[existingIndex],
                    types: [...newPlayers[existingIndex].types, activeList]
                };
            }
        } else {
            // New player
            newPlayers.push({
                id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: trimmed,
                types: [activeList],
                pairedWith: null,
            });
        }

        const newRosterData = { ...rosterData, players: newPlayers };
        setRosterData(newRosterData);
        setNewPlayerName('');
        saveRosters(newRosterData);
    };

    const handleRemovePlayer = (listType, playerId) => {
        // Remove tag. If no tags left, remove player completely and unpair.
        let newPlayers = rosterData.players.map(p => {
            if (p.id === playerId) {
                return { ...p, types: p.types.filter(t => t !== listType) };
            }
            return p;
        });

        const playerToUpdate = newPlayers.find(p => p.id === playerId);
        if (playerToUpdate && playerToUpdate.types.length === 0) {
            // Completely removing player
            if (playerToUpdate.pairedWith) {
                newPlayers = newPlayers.map(p => p.id === playerToUpdate.pairedWith ? { ...p, pairedWith: null } : p);
            }
            newPlayers = newPlayers.filter(p => p.id !== playerId);
        }

        const newRosterData = { ...rosterData, players: newPlayers };
        setRosterData(newRosterData);
        saveRosters(newRosterData);
    };

    const handlePairingChange = (listType, playerId, targetPairId) => {
        let newPlayers = [...rosterData.players];

        // 1. Unpair current player's old partner (if any)
        const currentPlayer = newPlayers.find(p => p.id === playerId);
        if (currentPlayer && currentPlayer.pairedWith) {
            newPlayers = newPlayers.map(p => p.id === currentPlayer.pairedWith ? { ...p, pairedWith: null } : p);
        }

        // 2. Unpair the target's old partner (if any)
        if (targetPairId) {
            const targetPlayer = newPlayers.find(p => p.id === targetPairId);
            if (targetPlayer && targetPlayer.pairedWith) {
                newPlayers = newPlayers.map(p => p.id === targetPlayer.pairedWith ? { ...p, pairedWith: null } : p);
            }
        }

        // 3. Set the new pair (or null if unpairing)
        newPlayers = newPlayers.map(p => {
            if (p.id === playerId) return { ...p, pairedWith: targetPairId || null };
            if (p.id === targetPairId) return { ...p, pairedWith: playerId };
            return p;
        });

        const newRosterData = { ...rosterData, players: newPlayers };
        setRosterData(newRosterData);
        saveRosters(newRosterData);
    };

    const visiblePlayers = rosterData.players.filter(p => p.types && p.types.includes(activeList));

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading rosters...</div>;
    }

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <List size={24} style={{ color: 'var(--accent-primary)' }} />
                <h2 style={{ margin: 0 }}>Roster Management</h2>
            </div>

            {error && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    {error}
                </div>
            )}

            {/* Tabs for Lists */}
            <div className="nav-wrap-container" style={{ marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                {['saturday', 'wednesday', 'guests'].map(list => (
                    <button
                        key={list}
                        onClick={() => setActiveList(list)}
                        style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            backgroundColor: activeList === list ? 'var(--accent-primary)' : 'transparent',
                            color: activeList === list ? 'white' : 'var(--text-secondary)',
                            fontWeight: activeList === list ? '600' : 'normal',
                            textTransform: 'capitalize',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {list === 'saturday' ? 'Saturday' : list === 'wednesday' ? 'Wednesday' : 'Guests'}
                    </button>
                ))}
            </div>

            {/* Add Player Form */}
            <form onSubmit={handleAddPlayer} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder={`Add player to ${activeList}...`}
                    style={{ flexGrow: 1 }}
                />
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0 1.5rem' }} disabled={saving}>
                    <Plus size={20} /> Add
                </button>
            </form>

            {/* Player List */}
            <div style={{ display: 'grid', gap: '0.5rem' }}>
                {visiblePlayers.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No players found in this list.</p>
                ) : (
                    visiblePlayers.map(player => (
                        <div
                            key={player.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem 1rem',
                                backgroundColor: player.pairedWith ? 'rgba(59, 130, 246, 0.05)' : 'var(--card-bg)',
                                border: `1px solid ${player.pairedWith ? 'var(--accent-primary)' : '#334155'}`,
                                borderRadius: '8px'
                            }}
                        >
                            <span style={{ fontWeight: player.pairedWith ? '500' : 'normal' }}>{player.name}</span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <select
                                    value={player.pairedWith || ''}
                                    onChange={(e) => handlePairingChange(activeList, player.id, e.target.value)}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.875rem',
                                        borderRadius: '4px',
                                        backgroundColor: 'var(--bg-color)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid #334155',
                                        maxWidth: '150px'
                                    }}
                                    disabled={saving}
                                >
                                    <option value="">No Pair</option>
                                    {visiblePlayers.filter(p => p.id !== player.id).map(other => (
                                        <option key={other.id} value={other.id}>Pair: {other.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleRemovePlayer(activeList, player.id)}
                                    style={{
                                        color: 'var(--danger)',
                                        backgroundColor: 'transparent',
                                        padding: '0.25rem',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    disabled={saving}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {saving && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '1rem', textAlign: 'right' }}>Saving...</p>}
        </div>
    );
}
