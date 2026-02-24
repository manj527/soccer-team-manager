import React, { useState, useEffect } from 'react';
import { Save, Users, DollarSign, Send, Plus, Trash2, CalendarDays, List, RefreshCcw } from 'lucide-react';

export function MoneyCalculation() {
    const [sessionType, setSessionType] = useState('saturday'); // saturday, wednesday, holiday
    const [seasonName, setSeasonName] = useState('');
    const [numberOfSessions, setNumberOfSessions] = useState(1);

    // Date tracking
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [rentalPerSession, setRentalPerSession] = useState('');

    const [rosterData, setRosterData] = useState({ players: [], communityFund: 0 });
    const [presentPlayerIds, setPresentPlayerIds] = useState([]);

    // Array of expense objects: { id, name, amount, includedPlayers: [playerId...] }
    const [expenses, setExpenses] = useState([
        { id: 'exp-1', name: 'Field Rental', amount: '', includedPlayers: [] }
    ]);

    const [manualAdjustments, setManualAdjustments] = useState({});
    const [isPublished, setIsPublished] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [publishedData, setPublishedData] = useState(null);

    const [newGuestName, setNewGuestName] = useState('');

    // Tab state: 'calculator' or 'events'
    const [calcTab, setCalcTab] = useState('calculator');
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [selectedEventIds, setSelectedEventIds] = useState([]);
    const [deleting, setDeleting] = useState(false);

    const fetchEvents = async () => {
        setEventsLoading(true);
        try {
            const res = await fetch('/api/seasons');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            data.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
            setEvents(data.filter(s => !s.hidden));
        } catch (err) {
            setError(err.message);
        } finally {
            setEventsLoading(false);
        }
    };

    useEffect(() => {
        if (calcTab === 'events') fetchEvents();
    }, [calcTab]);

    const handleDeleteSelected = async () => {
        if (selectedEventIds.length === 0) return;
        if (!confirm(`Hide ${selectedEventIds.length} season(s) from the UI? The data files will be preserved.`)) return;
        setDeleting(true);
        try {
            // Soft-delete: mark each season as hidden
            for (const id of selectedEventIds) {
                const season = events.find(e => e.id === id);
                if (!season) continue;
                await fetch('/api/save-season', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...season, hidden: true })
                });
            }
            setEvents(prev => prev.filter(e => !selectedEventIds.includes(e.id)));
            setSelectedEventIds([]);
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    const toggleEventSelection = (id) => {
        setSelectedEventIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // Fetch rosters on mount
    useEffect(() => {
        fetch('/api/rosters')
            .then(res => res.json())
            .then(data => {
                setRosterData({
                    players: data.players || [],
                    communityFund: data.communityFund || 0
                });
            })
            .catch(err => console.error("Error fetching rosters:", err));
    }, []);

    // Determine available players based on session type
    const availablePlayers = React.useMemo(() => {
        const typeFilter = sessionType === 'holiday'
            ? ['saturday', 'wednesday', 'guest']
            : [sessionType];
        return rosterData.players.filter(p => p.types && p.types.some(t => typeFilter.includes(t)));
    }, [sessionType, rosterData]);

    // When available players update, auto-include everyone as present
    useEffect(() => {
        const allIds = availablePlayers.map(p => p.id);
        setPresentPlayerIds(allIds);
    }, [availablePlayers]);

    // Derived array of actual present players based on checkboxes
    const presentPlayers = React.useMemo(() => {
        return availablePlayers.filter(p => presentPlayerIds.includes(p.id));
    }, [availablePlayers, presentPlayerIds]);

    // When present players update, auto-include them in existing expenses
    useEffect(() => {
        const pIds = presentPlayers.map(p => p.id);
        setExpenses(prev => prev.map(exp => ({ ...exp, includedPlayers: pIds })));
        setManualAdjustments({});
    }, [presentPlayers]);

    const togglePresence = (playerId) => {
        setPresentPlayerIds(prev =>
            prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
        );
    };

    const handleAddExpense = () => {
        setExpenses(prev => [
            ...prev,
            {
                id: `exp-${Date.now()}`,
                name: `Expense ${prev.length + 1}`,
                amount: '',
                includedPlayers: presentPlayerIds
            }
        ]);
    };

    const handleRemoveExpense = (id) => {
        if (expenses.length === 1) return; // keep at least one
        setExpenses(prev => prev.filter(e => e.id !== id));
    };

    const updateExpense = (id, field, value) => {
        setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
    };

    const togglePlayerInExpense = (expId, playerId) => {
        setExpenses(prev => prev.map(exp => {
            if (exp.id !== expId) return exp;
            const isIncluded = exp.includedPlayers.includes(playerId);
            if (isIncluded) {
                return { ...exp, includedPlayers: exp.includedPlayers.filter(id => id !== playerId) };
            } else {
                return { ...exp, includedPlayers: [...exp.includedPlayers, playerId] };
            }
        }));
    };

    const handleAdjustmentChange = (id, value) => {
        setManualAdjustments(prev => ({
            ...prev,
            [id]: value === '' ? undefined : parseFloat(value) || 0
        }));
    };

    const handleQuickAddGuest = async (e) => {
        e.preventDefault();
        if (!newGuestName.trim()) return;

        const newGuest = {
            id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: newGuestName.trim(),
            types: ['guest'],
            pairedWith: null
        };

        const newRosterData = {
            ...rosterData,
            players: [...rosterData.players, newGuest]
        };

        try {
            await fetch('/api/rosters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRosterData)
            });
            setRosterData(newRosterData);
            setNewGuestName('');
            setPresentPlayerIds(prev => [...prev, newGuest.id]);
        } catch (err) {
            setError("Failed to add guest: " + err.message);
        }
    };

    // Calculate expected sessions between dates
    const getExpectedSessions = React.useCallback(() => {
        if (sessionType === 'holiday') return 1;
        if (!startDate || !endDate) return 0;

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) return 0;

        const targetDay = sessionType === 'saturday' ? 6 : 3; // 6 = Sat, 3 = Wed
        let count = 0;
        let current = new Date(start);

        // Adjust to local time safely to avoid timezone jumps when checking days
        current = new Date(current.getTime() + current.getTimezoneOffset() * 60000);
        const endLocal = new Date(end.getTime() + end.getTimezoneOffset() * 60000);

        while (current <= endLocal) {
            if (current.getDay() === targetDay) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    }, [startDate, endDate, sessionType]);

    // When dates or session type change, auto-update the actual sessions
    useEffect(() => {
        const expected = getExpectedSessions();
        if (expected > 0) {
            setNumberOfSessions(expected);
        } else if (sessionType === 'holiday') {
            setNumberOfSessions(1);
        }
    }, [startDate, endDate, sessionType, getExpectedSessions]);

    // Auto-calculate the default expense amount based on rental per session
    useEffect(() => {
        setExpenses(prev => {
            const exp1Index = prev.findIndex(e => e.id === 'exp-1');
            if (exp1Index === -1) return prev;

            const calcAmount = rentalPerSession ? (parseFloat(rentalPerSession) * numberOfSessions).toFixed(2) : '';
            if (prev[exp1Index].amount !== calcAmount) {
                const newExpenses = [...prev];
                newExpenses[exp1Index] = { ...newExpenses[exp1Index], amount: calcAmount };
                if (rentalPerSession && prev[exp1Index].name === '') {
                    newExpenses[exp1Index].name = 'Field Rental'; // ensure it has a name
                }
                return newExpenses;
            }
            return prev;
        });
    }, [rentalPerSession, numberOfSessions]);

    // Calculate final split
    const getCalculatedData = () => {
        const totalAmount = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

        // Calculate each player's base share from each expense
        const calculatedPlayerShares = {};
        presentPlayers.forEach(p => {
            calculatedPlayerShares[p.id] = 0;
        });

        expenses.forEach(exp => {
            const expAmount = parseFloat(exp.amount) || 0;
            const validIncludedPlayers = exp.includedPlayers.filter(id => presentPlayerIds.includes(id));
            const includedCount = validIncludedPlayers.length;
            if (includedCount > 0 && expAmount > 0) {
                const share = expAmount / includedCount;
                validIncludedPlayers.forEach(pId => {
                    if (calculatedPlayerShares[pId] !== undefined) {
                        calculatedPlayerShares[pId] += share;
                    }
                });
            }
        });

        // Apply manual overrides
        const playerContributions = presentPlayers.map(p => {
            const hasOverride = manualAdjustments[p.id] !== undefined;
            const amount = hasOverride ? Math.max(0, manualAdjustments[p.id]) : calculatedPlayerShares[p.id];
            return {
                id: p.id,
                name: p.name,
                amount: amount,
                isPaid: false
            };
        }).filter(p => p.amount > 0 || manualAdjustments[p.id] !== undefined); // Only include those who owe something or were explicitly overridden

        return {
            totalAmount,
            playerContributions
        };
    };

    const calcData = getCalculatedData();

    const handlePublish = async () => {
        if (!seasonName.trim()) {
            setError('Season Name is required');
            return;
        }
        if (sessionType !== 'holiday' && (!startDate || !endDate)) {
            setError('Please select both a Start Date and End Date');
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            setError('End Date cannot be before Start Date');
            return;
        }
        if (calcData.totalAmount <= 0) {
            setError('Total Amount must be greater than 0');
            return;
        }

        setLoading(true);
        setError(null);

        const expected = getExpectedSessions();
        const byeDays = expected > numberOfSessions ? (expected - numberOfSessions) : 0;

        const payload = {
            name: `${sessionType === 'holiday' ? 'Holiday Special' : sessionType === 'wednesday' ? 'Wednesday Indoor' : 'Saturday Indoor'} - ${seasonName}`,
            totalAmount: calcData.totalAmount,
            players: calcData.playerContributions,
            expenses: expenses,
            startDate: startDate,
            endDate: endDate,
            numberOfSessions: numberOfSessions || 1,
            byeDays: byeDays
        };

        try {
            const res = await fetch('/api/save-season', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save season');
            const data = await res.json();

            setPublishedData({ ...payload, id: data.id, lastUpdated: new Date().toISOString() });
            setIsPublished(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Published success view (rendered inside calculator tab)
    const renderPublishedView = () => (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                    <Save size={24} /> Successfully Published!
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>Season: {publishedData.name}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '8px', marginBottom: '2rem' }}>
                <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Amount</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${publishedData.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Players Paying</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{publishedData.players.length}</p>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #334155', color: 'var(--text-secondary)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem', fontWeight: 'normal' }}>Player</th>
                        <th style={{ padding: '0.75rem', fontWeight: 'normal', textAlign: 'right' }}>Total</th>
                        <th style={{ padding: '0.75rem', fontWeight: 'normal', textAlign: 'right' }}>Per Session</th>
                    </tr>
                </thead>
                <tbody>
                    {publishedData.players.map((p, idx) => {
                        const perSession = p.amount / (publishedData.numberOfSessions || 1);
                        return (
                            <tr key={p.id} style={{ borderBottom: '1px solid #334155', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                <td style={{ padding: '0.75rem' }}>{p.name}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>${p.amount.toFixed(2)}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-secondary)' }}>${perSession.toFixed(2)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <button
                className="btn-secondary"
                style={{ marginTop: '2rem', width: '100%' }}
                onClick={() => {
                    setIsPublished(false);
                    setSeasonName('');
                    setStartDate('');
                    setEndDate('');
                    setNumberOfSessions(1);
                    setRentalPerSession('');
                    setExpenses([{ id: 'exp-1', name: 'Field Rental', amount: '', includedPlayers: availablePlayers.map(p => p.id) }]);
                    setManualAdjustments({});
                }}
            >
                Create New Season
            </button>
        </div>
    );

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                {[{ key: 'calculator', label: 'Calculator', icon: <DollarSign size={18} /> }, { key: 'events', label: 'Events', icon: <List size={18} /> }].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setCalcTab(tab.key)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            backgroundColor: calcTab === tab.key ? 'var(--accent-primary)' : 'transparent',
                            color: calcTab === tab.key ? 'white' : 'var(--text-secondary)',
                            fontWeight: calcTab === tab.key ? '600' : 'normal',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {error && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    {error}
                </div>
            )}

            {/* Events Tab */}
            {calcTab === 'events' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <List size={24} style={{ color: 'var(--accent-primary)' }} /> Published Events
                        </h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {selectedEventIds.length > 0 && (
                                <button
                                    onClick={handleDeleteSelected}
                                    className="btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', color: '#f87171', borderColor: '#f87171' }}
                                    disabled={deleting}
                                >
                                    <Trash2 size={16} /> Delete ({selectedEventIds.length})
                                </button>
                            )}
                            <button onClick={fetchEvents} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                                <RefreshCcw size={16} /> Refresh
                            </button>
                        </div>
                    </div>

                    {eventsLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading events...</div>
                    ) : events.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <CalendarDays size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>No published events yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {events.map(ev => {
                                const isSelected = selectedEventIds.includes(ev.id);
                                return (
                                    <div key={ev.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '0.75rem 1rem',
                                        backgroundColor: isSelected ? 'rgba(248, 113, 113, 0.05)' : 'var(--card-bg)',
                                        border: `1px solid ${isSelected ? 'rgba(248, 113, 113, 0.3)' : '#334155'}`,
                                        borderRadius: '8px',
                                        transition: 'all 0.2s'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleEventSelection(ev.id)}
                                            style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                                        />
                                        <div style={{ flexGrow: 1 }}>
                                            <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{ev.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                <span>Total: ${ev.totalAmount?.toFixed(2) || '0.00'}</span>
                                                <span>Players: {ev.players?.length || 0}</span>
                                                <span>Sessions: {ev.numberOfSessions || 1}</span>
                                                {ev.byeDays > 0 && <span style={{ color: '#f87171' }}>Bye: {ev.byeDays}</span>}
                                                {ev.startDate && <span>{ev.startDate} → {ev.endDate}</span>}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
                                            ${ev.totalAmount?.toFixed(2) || '0.00'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Calculator Tab */}
            {calcTab === 'calculator' && (
                isPublished && publishedData ? renderPublishedView() : (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Session Type
                                </label>
                                <select
                                    value={sessionType}
                                    onChange={(e) => setSessionType(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--card-bg)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        fontFamily: 'inherit',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <option value="saturday">Saturday Indoor</option>
                                    <option value="wednesday">Wednesday Indoor</option>
                                    <option value="holiday">Holiday Special</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Season / Event Name
                                </label>
                                <input
                                    type="text"
                                    value={seasonName}
                                    onChange={(e) => setSeasonName(e.target.value)}
                                    placeholder="e.g. Summer 2026"
                                />
                            </div>
                        </div>

                        {/* Session Count and Dates */}
                        <div style={{ display: 'grid', gridTemplateColumns: sessionType === 'holiday' ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            {sessionType !== 'holiday' && (
                                <>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </>
                            )}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Actual Sessions</span>
                                        {sessionType !== 'holiday' && getExpectedSessions() > 0 && (
                                            <span style={{ fontSize: '0.75rem', color: '#f87171' }}>
                                                (Bye: {Math.max(0, getExpectedSessions() - numberOfSessions)})
                                            </span>
                                        )}
                                    </div>
                                </label>
                                <input
                                    type="number"
                                    value={numberOfSessions}
                                    onChange={(e) => setNumberOfSessions(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                    style={{ width: '100%' }}
                                    disabled={sessionType === 'holiday'}
                                />
                                {sessionType !== 'holiday' && getExpectedSessions() > 0 && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        Calculated expected: {getExpectedSessions()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Rental Per Session ($)
                                </label>
                                <input
                                    type="number"
                                    value={rentalPerSession}
                                    onChange={(e) => setRentalPerSession(e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        {/* Players Present Checklist */}
                        <div style={{ marginBottom: '2rem', padding: '1.25rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Users size={20} /> Players Present ({presentPlayerIds.length}/{availablePlayers.length})
                                </h3>

                                <form onSubmit={handleQuickAddGuest} style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={newGuestName}
                                        onChange={(e) => setNewGuestName(e.target.value)}
                                        placeholder="Quick add guest..."
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', width: '150px' }}
                                    />
                                    <button type="submit" className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
                                        Add
                                    </button>
                                </form>
                            </div>

                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Uncheck any players who were absent so they are completely excluded from the split options.
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                                {availablePlayers.map(p => {
                                    const isPresent = presentPlayerIds.includes(p.id);
                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => togglePresence(p.id)}
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                fontSize: '0.875rem',
                                                borderRadius: '999px',
                                                cursor: 'pointer',
                                                backgroundColor: isPresent ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                                                color: isPresent ? 'var(--success)' : 'var(--text-secondary)',
                                                border: `1px solid ${isPresent ? 'var(--success)' : '#334155'}`,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {p.name} {isPresent ? '✓' : ''}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Expenses Management */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Expenses</h3>
                                <button onClick={handleAddExpense} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Plus size={16} /> Add Expense
                                </button>
                            </div>

                            {expenses.map((exp) => (
                                <div key={exp.id} style={{ padding: '1.25rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ flexGrow: 2 }}>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Expense Name</label>
                                            <input
                                                type="text"
                                                value={exp.name}
                                                onChange={(e) => updateExpense(exp.id, 'name', e.target.value)}
                                                placeholder="e.g. Field Rental"
                                            />
                                        </div>
                                        <div style={{ flexGrow: 1 }}>
                                            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                <span>Amount ($)</span>
                                                {exp.id === 'exp-1' && rentalPerSession !== '' && (
                                                    <span style={{ color: 'var(--accent-primary)', fontSize: '0.65rem' }}>Auto-calculated</span>
                                                )}
                                            </label>
                                            <input
                                                type="number"
                                                value={exp.amount}
                                                onChange={(e) => updateExpense(exp.id, 'amount', e.target.value)}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                disabled={exp.id === 'exp-1' && rentalPerSession !== ''}
                                                style={{
                                                    opacity: (exp.id === 'exp-1' && rentalPerSession !== '') ? 0.7 : 1,
                                                    cursor: (exp.id === 'exp-1' && rentalPerSession !== '') ? 'not-allowed' : 'auto'
                                                }}
                                            />
                                        </div>
                                        {expenses.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveExpense(exp.id)}
                                                style={{ marginTop: '1.5rem', padding: '0.75rem', color: 'var(--danger)', backgroundColor: 'transparent' }}
                                                title="Remove Expense"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            Included Players ({exp.includedPlayers.length}/{presentPlayers.length})
                                        </label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                                            {presentPlayers.map(p => {
                                                const isIncluded = exp.includedPlayers.includes(p.id);
                                                return (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => togglePlayerInExpense(exp.id, p.id)}
                                                        style={{
                                                            padding: '0.25rem 0.75rem',
                                                            fontSize: '0.875rem',
                                                            borderRadius: '999px',
                                                            cursor: 'pointer',
                                                            backgroundColor: isIncluded ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                                            color: isIncluded ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                            border: `1px solid ${isIncluded ? 'var(--accent-primary)' : '#334155'}`,
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {p.name}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Player Overrides & Final Calc */}
                        <div style={{ borderTop: '1px solid #334155', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={20} /> Final Shares & Adjustments
                            </h3>

                            <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {calcData.playerContributions.length === 0 && presentPlayers.length > 0 && (
                                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>Enter expense amounts to see calculated shares.</p>
                                )}
                                {presentPlayers.map((player) => {
                                    // Recompute individual baseline for display
                                    let calculatedAmount = 0;
                                    expenses.forEach(exp => {
                                        const expAmount = parseFloat(exp.amount) || 0;
                                        const includedCount = exp.includedPlayers.length;
                                        if (includedCount > 0 && expAmount > 0 && exp.includedPlayers.includes(player.id)) {
                                            calculatedAmount += (expAmount / includedCount);
                                        }
                                    });

                                    const hasManual = manualAdjustments[player.id] !== undefined;

                                    return (
                                        <div
                                            key={player.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0.75rem',
                                                backgroundColor: 'var(--card-bg)',
                                                border: `1px solid ${hasManual ? 'var(--accent-primary)' : '#334155'}`,
                                                borderRadius: '8px',
                                            }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '500' }}>{player.name}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    Calculated: ${calculatedAmount.toFixed(2)}
                                                    {numberOfSessions > 1 && ` ($${(calculatedAmount / numberOfSessions).toFixed(2)}/session)`}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.875rem', color: hasManual ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                                                    Override: $
                                                </span>
                                                <input
                                                    type="number"
                                                    value={manualAdjustments[player.id] !== undefined ? manualAdjustments[player.id] : ''}
                                                    onChange={(e) => handleAdjustmentChange(player.id, e.target.value)}
                                                    placeholder={calculatedAmount.toFixed(2)}
                                                    style={{
                                                        width: '80px',
                                                        padding: '0.25rem 0.5rem',
                                                        fontSize: '0.875rem',
                                                        borderColor: hasManual ? 'var(--accent-primary)' : '#334155'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Total Expenses:</span>
                                <strong style={{ fontSize: '1.1rem' }}>${calcData.totalAmount.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Total Assigned:</span>
                                <strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>
                                    ${calcData.playerContributions.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                                </strong>
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handlePublish}
                            disabled={loading}
                            style={{ opacity: loading ? 0.7 : 1 }}
                        >
                            <Send size={20} />
                            {loading ? 'Publishing...' : 'Publish Calculation'}
                        </button>
                    </div>
                )
            )}
        </div>
    );
}
