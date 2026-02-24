import React, { useState, useEffect } from 'react';
import { DollarSign, Check, Copy, AlertCircle, RefreshCcw, ChevronDown, ChevronUp, Clock, Users, User } from 'lucide-react';

export const PaymentTracking = React.memo(() => {
    const [seasons, setSeasons] = useState([]);
    const [showHistorical, setShowHistorical] = useState(false);
    const [selectedSeasonId, setSelectedSeasonId] = useState('');
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);


    useEffect(() => { fetchSeasons(); }, []);

    const fetchSeasons = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/seasons');
            if (!res.ok) throw new Error('Failed to fetch seasons');
            const data = await res.json();
            data.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
            setSeasons(data.filter(s => !s.hidden));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Show max 5 or all
    const visibleSeasons = React.useMemo(() => {
        return showHistorical ? seasons : seasons.slice(0, 5);
    }, [seasons, showHistorical]);

    // All unique players across all seasons
    const allPlayers = React.useMemo(() => {
        const map = new Map();
        seasons.forEach(s => {
            (s.players || []).forEach(p => {
                if (!map.has(p.id)) map.set(p.id, p.name);
            });
        });
        return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    }, [seasons]);

    // Selected season data
    const selectedSeason = seasons.find(s => s.id === selectedSeasonId);

    // Player ledger for specific player
    const playerSeasonBreakdown = React.useMemo(() => {
        if (!selectedPlayerId) return [];
        return seasons
            .map(s => {
                const p = (s.players || []).find(pl => pl.id === selectedPlayerId);
                if (!p) return null;
                const owed = p.amount || 0;
                const paid = typeof p.amountPaid === 'number' ? p.amountPaid : (p.isPaid ? owed : 0);
                return { seasonId: s.id, seasonName: s.name, owed, paid, balance: paid - owed };
            })
            .filter(Boolean);
    }, [selectedPlayerId, seasons]);

    // Global pending across all seasons
    const globalPending = React.useMemo(() => {
        const ledger = {};
        seasons.forEach(s => {
            (s.players || []).forEach(p => {
                if (!ledger[p.id]) ledger[p.id] = { name: p.name, totalOwed: 0, totalPaid: 0 };
                const owed = p.amount || 0;
                const paid = typeof p.amountPaid === 'number' ? p.amountPaid : (p.isPaid ? owed : 0);
                ledger[p.id].totalOwed += owed;
                ledger[p.id].totalPaid += paid;
            });
        });
        return Object.entries(ledger)
            .map(([id, d]) => ({ id, ...d, balance: d.totalPaid - d.totalOwed }))
            .filter(p => p.balance < -0.01)
            .sort((a, b) => a.balance - b.balance);
    }, [seasons]);

    const handleUpdatePayment = async (seasonId, playerId, newAmountPaid) => {
        setSaving(true);
        try {
            const season = seasons.find(s => s.id === seasonId);
            if (!season) return;
            const updatedPlayers = season.players.map(p =>
                p.id === playerId ? { ...p, amountPaid: parseFloat(newAmountPaid) || 0, isPaid: (parseFloat(newAmountPaid) || 0) >= p.amount } : p
            );
            const updatedSeason = { ...season, players: updatedPlayers, lastUpdated: new Date().toISOString() };
            const res = await fetch('/api/save-season', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSeason)
            });
            if (!res.ok) throw new Error('Failed to update');
            setSeasons(prev => prev.map(s => s.id === seasonId ? updatedSeason : s));
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCopyPending = () => {
        if (globalPending.length === 0) return;
        let text = `*Pending Payments*\n\n`;
        globalPending.forEach(p => { text += `${p.name}: $${Math.abs(p.balance).toFixed(2)}\n`; });
        text += `\nTotal Outstanding: $${globalPending.reduce((s, p) => s + Math.abs(p.balance), 0).toFixed(2)}`;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading payment data...</div>;
    }

    return (
        <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <DollarSign size={24} style={{ color: 'var(--accent-primary)' }} />
                    <h2 style={{ margin: 0 }}>Payment Tracking</h2>
                </div>
                <button onClick={fetchSeasons} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                    <RefreshCcw size={16} /> Refresh
                </button>
            </div>

            {error && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    {error}
                </div>
            )}

            {/* Filter Row */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                {/* Season Selector */}
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <Users size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} /> Season
                    </label>
                    <select
                        value={selectedSeasonId}
                        onChange={(e) => { setSelectedSeasonId(e.target.value); setSelectedPlayerId(''); }}
                        style={{ width: '100%' }}
                    >
                        <option value="">— All Seasons —</option>
                        {visibleSeasons.map(s => (
                            <option key={s.id} value={s.id}>{s.name} - ${s.totalAmount?.toFixed(2)}</option>
                        ))}
                    </select>
                </div>

                {/* Player Selector */}
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <User size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} /> Player
                    </label>
                    <select
                        value={selectedPlayerId}
                        onChange={(e) => { setSelectedPlayerId(e.target.value); setSelectedSeasonId(''); }}
                        style={{ width: '100%' }}
                    >
                        <option value="">— All Players —</option>
                        {allPlayers.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* Historical Toggle */}
                {seasons.length > 5 && (
                    <button
                        onClick={() => setShowHistorical(!showHistorical)}
                        className={showHistorical ? "btn-primary" : "btn-secondary"}
                        style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                    >
                        <Clock size={18} /> {showHistorical ? 'All' : 'Historical'}
                    </button>
                )}
            </div>

            {/* View: Single Season Selected */}
            {selectedSeasonId && selectedSeason && (
                <div>
                    <div style={{ padding: '1rem', backgroundColor: '#1e293b', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Season</p>
                            <p style={{ fontWeight: 'bold' }}>{selectedSeason.name}</p>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Total</p>
                            <p style={{ fontWeight: 'bold' }}>${selectedSeason.totalAmount?.toFixed(2)}</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {(selectedSeason.players || []).map(p => {
                            const owed = p.amount || 0;
                            const paid = typeof p.amountPaid === 'number' ? p.amountPaid : (p.isPaid ? owed : 0);
                            const bal = paid - owed;
                            return (
                                <div key={p.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.75rem 1rem',
                                    backgroundColor: bal < -0.01 ? 'rgba(248, 113, 113, 0.05)' : 'var(--card-bg)',
                                    border: `1px solid ${bal < -0.01 ? 'rgba(248, 113, 113, 0.2)' : '#334155'}`,
                                    borderRadius: '8px'
                                }}>
                                    <div>
                                        <span style={{ fontWeight: '500' }}>{p.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.75rem' }}>
                                            Owes: ${owed.toFixed(2)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <input
                                            type="number"
                                            value={paid}
                                            onChange={(e) => handleUpdatePayment(selectedSeason.id, p.id, e.target.value)}
                                            min="0" step="0.01"
                                            style={{ width: '80px', textAlign: 'right', padding: '0.2rem 0.4rem', fontSize: '0.85rem', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid #334155', borderRadius: '4px' }}
                                            disabled={saving}
                                        />
                                        {paid < owed ? (
                                            <button onClick={() => handleUpdatePayment(selectedSeason.id, p.id, owed)} className="btn-primary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }} disabled={saving}>
                                                <Check size={12} /> Paid
                                            </button>
                                        ) : (
                                            <span style={{ color: '#22c55e' }}>✓</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* View: Single Player Selected */}
            {selectedPlayerId && !selectedSeasonId && (
                <div>
                    <h3 style={{ marginBottom: '1rem' }}>
                        {allPlayers.find(p => p.id === selectedPlayerId)?.name || 'Player'} — Season Breakdown
                    </h3>
                    {playerSeasonBreakdown.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No seasons found for this player.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {playerSeasonBreakdown.map(s => (
                                <div key={s.seasonId} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.75rem 1rem',
                                    backgroundColor: s.balance < -0.01 ? 'rgba(248, 113, 113, 0.05)' : s.balance > 0.01 ? 'rgba(34, 197, 94, 0.05)' : 'var(--card-bg)',
                                    border: `1px solid ${s.balance < -0.01 ? 'rgba(248, 113, 113, 0.2)' : s.balance > 0.01 ? 'rgba(34, 197, 94, 0.2)' : '#334155'}`,
                                    borderRadius: '8px'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '500' }}>{s.seasonName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            Owed: ${s.owed.toFixed(2)} | Paid: ${s.paid.toFixed(2)}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <input
                                            type="number"
                                            value={s.paid}
                                            onChange={(e) => handleUpdatePayment(s.seasonId, selectedPlayerId, e.target.value)}
                                            min="0" step="0.01"
                                            style={{ width: '80px', textAlign: 'right', padding: '0.2rem 0.4rem', fontSize: '0.85rem', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid #334155', borderRadius: '4px' }}
                                            disabled={saving}
                                        />
                                        {s.balance < -0.01 ? (
                                            <button
                                                onClick={() => handleUpdatePayment(s.seasonId, selectedPlayerId, s.owed)}
                                                className="btn-primary"
                                                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                                                disabled={saving}
                                            >
                                                <Check size={12} /> Paid
                                            </button>
                                        ) : s.balance > 0.01 ? (
                                            <span style={{ fontWeight: 'bold', color: '#22c55e' }}>
                                                +${s.balance.toFixed(2)}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#22c55e' }}>✓</span>
                                        )}
                                        {s.balance < -0.01 && (
                                            <span style={{ fontWeight: 'bold', color: '#f87171' }}>
                                                -${Math.abs(s.balance).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Net Balance: </span>
                                {(() => {
                                    const net = playerSeasonBreakdown.reduce((s, x) => s + x.balance, 0);
                                    return <span style={{ fontWeight: 'bold', color: net < -0.01 ? '#f87171' : net > 0.01 ? '#22c55e' : 'var(--text-secondary)', fontSize: '1.1rem' }}>
                                        {net < -0.01 ? `-$${Math.abs(net).toFixed(2)}` : net > 0.01 ? `+$${net.toFixed(2)}` : '$0.00'}
                                    </span>;
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Default: No selection — show pending summary */}
            {!selectedSeasonId && !selectedPlayerId && (
                <div>
                    {globalPending.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'rgba(34, 197, 94, 0.05)', borderRadius: '8px', color: 'var(--success)' }}>
                            <Check size={32} style={{ marginBottom: '0.5rem' }} />
                            <p style={{ margin: 0, fontWeight: '500' }}>Everyone is settled up!</p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
                                    <AlertCircle size={20} /> Pending ({globalPending.length})
                                </h3>
                                <button onClick={handleCopyPending} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                                    <Copy size={16} /> {copied ? 'Copied!' : 'Copy List'}
                                </button>
                            </div>
                            {globalPending.map(p => (
                                <div key={p.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.75rem 1rem', marginBottom: '0.5rem',
                                    backgroundColor: 'rgba(248, 113, 113, 0.05)',
                                    border: '1px solid rgba(248, 113, 113, 0.2)',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                                    onClick={() => setSelectedPlayerId(p.id)}
                                >
                                    <span style={{ fontWeight: '500' }}>{p.name}</span>
                                    <span style={{ fontWeight: 'bold', color: '#f87171' }}>
                                        -${Math.abs(p.balance).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Outstanding: </span>
                                <span style={{ fontWeight: 'bold', color: '#f87171', fontSize: '1.1rem' }}>
                                    ${globalPending.reduce((s, p) => s + Math.abs(p.balance), 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {saving && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'right' }}>Saving...</p>}
        </div>
    );
});
