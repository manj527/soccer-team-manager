import React, { useState } from 'react';
import { PlayerInput } from './components/PlayerInput';
import { TeamBuilder } from './components/TeamBuilder';
import { ShareSection } from './components/ShareSection';
import { MVPSelector } from './components/MVPSelector';
import { MoneyCalculation } from './components/MoneyCalculation';
import { PaymentTracking } from './components/PaymentTracking';
import { RosterManagement } from './components/RosterManagement';
import { Trophy, Users, DollarSign, Calendar, List, Download, Upload, UserPlus, Newspaper } from 'lucide-react';
import { MatchHighlights } from './components/MatchHighlights';

const DEFAULT_PLAYERS = [

  { id: 'def-1', name: 'Manoj' },
  { id: 'def-2', name: 'Josh' },
  { id: 'def-3', name: 'Sajee' },
  { id: 'def-4', name: 'Shine' },
  { id: 'def-5', name: 'Akhil' },
  { id: 'def-6', name: 'Lalu' },
  { id: 'def-7', name: 'Abhishek' },
  { id: 'def-8', name: 'Mahesh' },
  { id: 'def-9', name: 'Abhinav' },
  { id: 'def-10', name: 'Azeem' },
  { id: 'def-11', name: 'Shammer' },
  { id: 'def-12', name: 'Sudheer' },
  { id: 'def-13', name: 'Gipsy' },
  { id: 'def-14', name: 'Das' },
  { id: 'def-15', name: 'Appu' },
  { id: 'def-16', name: 'Shishir' },
  { id: 'def-17', name: 'Shijo' },
  { id: 'def-18', name: 'Val' },
  { id: 'def-19', name: 'Nisam' },
  { id: 'def-20', name: 'Santhosh' }


];

function App() {
  const [activeTab, setActiveTab] = useState('teams');

  const half = Math.ceil(DEFAULT_PLAYERS.length / 2);
  const [players, setPlayers] = useState([]); // Unassigned pool
  const [teamA, setTeamA] = useState(DEFAULT_PLAYERS.slice(0, half));
  const [teamB, setTeamB] = useState(DEFAULT_PLAYERS.slice(half));

  const [colorA, setColorA] = useState('#ef4444'); // Red
  const [colorB, setColorB] = useState('#3b82f6'); // Blue
  const [nameA, setNameA] = useState('Team A');
  const [nameB, setNameB] = useState('Team B');
  const [iconA, setIconA] = useState('shield');
  const [iconB, setIconB] = useState('swords');

  // Session loader state
  const [rosters, setRosters] = useState({ saturday: [], wednesday: [], guests: [] });
  const [sessionForTeams, setSessionForTeams] = useState('saturday');

  const fetchRosters = React.useCallback(async () => {
    try {
      const res = await fetch('/api/rosters');
      const data = await res.json();
      const allPlayers = data.players || [];
      const newRosters = {
        saturday: allPlayers.filter(p => p.types && p.types.includes('saturday')),
        wednesday: allPlayers.filter(p => p.types && p.types.includes('wednesday')),
        guests: allPlayers.filter(p => p.types && p.types.includes('guest'))
      };
      setRosters(newRosters);
      return newRosters;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  React.useEffect(() => {
    fetchRosters();
  }, [activeTab, fetchRosters]); // Refetch when changing tabs to ensure fresh data

  const handleGenerateTeams = async () => {
    const latestRosters = await fetchRosters();

    let rosterToLoad = [];
    if (sessionForTeams === 'saturday') rosterToLoad = latestRosters.saturday;
    if (sessionForTeams === 'wednesday') rosterToLoad = latestRosters.wednesday;
    if (sessionForTeams === 'holiday') {
      const all = [...latestRosters.saturday, ...latestRosters.wednesday, ...latestRosters.guests];
      const unique = [];
      const map = new Map();
      for (const item of all) {
        if (!map.has(item.id)) { map.set(item.id, true); unique.push(item); }
      }
      rosterToLoad = unique;
    }

    if (rosterToLoad.length === 0) {
      alert("No players found in this session roster to generate teams.");
      return;
    }

    const newTeamA = [];
    const newTeamB = [];
    const handledIds = new Set();
    const availablePlayers = [...rosterToLoad];

    // 1. Process explicit pairs first
    for (const player of availablePlayers) {
      if (handledIds.has(player.id)) continue;

      if (player.pairedWith) {
        const partner = availablePlayers.find(p => p.id === player.pairedWith);
        if (partner && !handledIds.has(partner.id)) {
          // Ensure balanced distribution when dropping pairs
          if (newTeamA.length <= newTeamB.length) {
            newTeamA.push(player);
            newTeamB.push(partner);
          } else {
            newTeamB.push(player);
            newTeamA.push(partner);
          }
          handledIds.add(player.id);
          handledIds.add(partner.id);
        }
      }
    }

    // 2. Process all remaining players
    const remainingPlayers = availablePlayers.filter(p => !handledIds.has(p.id));

    // Optional: Shuffle remaining players for randomness (comment out if you want strict sequential)
    for (let i = remainingPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingPlayers[i], remainingPlayers[j]] = [remainingPlayers[j], remainingPlayers[i]];
    }

    for (const player of remainingPlayers) {
      if (newTeamA.length <= newTeamB.length) {
        newTeamA.push(player);
      } else {
        newTeamB.push(player);
      }
    }

    // Clear unassigned pool and replace teams
    setPlayers([]);
    setTeamA(newTeamA);
    setTeamB(newTeamB);
  };

  const handleLoadGuests = async () => {
    const latestRosters = await fetchRosters();
    const guests = latestRosters.guests || [];
    if (guests.length === 0) {
      alert("No guests found in roster.");
      return;
    }

    // Filter out duplicates that might already be drawn
    const existingIds = new Set([...players, ...teamA, ...teamB].map(p => p.id));
    const newGuests = guests.filter(g => !existingIds.has(g.id));

    if (newGuests.length === 0) {
      alert("All guests from the roster are already on the screen.");
      return;
    }

    setPlayers(prev => [...prev, ...newGuests]);
  };

  const handleAddPlayers = (names, target) => {
    const newPlayers = names.map((name) => ({
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
    }));

    if (target === 'A') {
      setTeamA((prev) => [...prev, ...newPlayers]);
    } else if (target === 'B') {
      setTeamB((prev) => [...prev, ...newPlayers]);
    } else {
      setPlayers((prev) => [...prev, ...newPlayers]);
    }
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '2rem' }}>
        <h1>
          <Trophy size={32} style={{ verticalAlign: 'middle', marginRight: '10px', color: '#fbbf24' }} />
          Soccer Team Manager
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Paste names, organize teams, and share.
        </p>
      </header>

      <div className="nav-wrap-container" style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('teams')}
          style={{
            padding: '0.6rem 0.8rem',
            borderRadius: '8px',
            backgroundColor: activeTab === 'teams' ? 'var(--accent-primary)' : 'var(--card-bg)',
            color: activeTab === 'teams' ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'teams' ? 'var(--accent-primary)' : '#334155'}`,
            display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500',
            fontSize: 'max(0.85rem, 3.5vw)'
          }}
        >
          <Users size={16} /> Teams
        </button>
        <button
          onClick={() => setActiveTab('calculation')}
          style={{
            padding: '0.6rem 0.8rem',
            borderRadius: '8px',
            backgroundColor: activeTab === 'calculation' ? 'var(--accent-primary)' : 'var(--card-bg)',
            color: activeTab === 'calculation' ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'calculation' ? 'var(--accent-primary)' : '#334155'}`,
            display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500',
            fontSize: 'max(0.85rem, 3.5vw)'
          }}
        >
          <DollarSign size={16} /> Calculation
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          style={{
            padding: '0.6rem 0.8rem',
            borderRadius: '8px',
            backgroundColor: activeTab === 'payments' ? 'var(--accent-primary)' : 'var(--card-bg)',
            color: activeTab === 'payments' ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'payments' ? 'var(--accent-primary)' : '#334155'}`,
            display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500',
            fontSize: 'max(0.85rem, 3.5vw)'
          }}
        >
          <Calendar size={16} /> Payments
        </button>
        <button
          onClick={() => setActiveTab('rosters')}
          style={{
            padding: '0.6rem 0.8rem',
            borderRadius: '8px',
            backgroundColor: activeTab === 'rosters' ? 'var(--accent-primary)' : 'var(--card-bg)',
            color: activeTab === 'rosters' ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'rosters' ? 'var(--accent-primary)' : '#334155'}`,
            display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500',
            fontSize: 'max(0.85rem, 3.5vw)'
          }}
        >
          <List size={16} /> Rosters
        </button>
        <button
          onClick={() => setActiveTab('highlights')}
          style={{
            padding: '0.6rem 0.8rem',
            borderRadius: '8px',
            backgroundColor: activeTab === 'highlights' ? 'var(--accent-primary)' : 'var(--card-bg)',
            color: activeTab === 'highlights' ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === 'highlights' ? 'var(--accent-primary)' : '#334155'}`,
            display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500',
            fontSize: 'max(0.85rem, 3.5vw)'
          }}
        >
          <Newspaper size={16} /> Highlights
        </button>
      </div>

      {activeTab === 'teams' && (
        <>
          <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flexGrow: 1 }}>
              <select
                value={sessionForTeams}
                onChange={(e) => setSessionForTeams(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
              >
                <option value="saturday">Saturday Indoor</option>
                <option value="wednesday">Wednesday Indoor</option>
                <option value="holiday">Holiday Special</option>
              </select>
            </div>
            <button onClick={handleGenerateTeams} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}>
              <Users size={18} /> Generate Teams
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ flexGrow: 1 }}>
              <PlayerInput onAddPlayers={handleAddPlayers} />
            </div>
            <button
              onClick={handleLoadGuests}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', whiteSpace: 'nowrap', marginLeft: '1rem', marginTop: '1.75rem' }}
              title="Load saved guests from Roster manager"
            >
              <UserPlus size={18} /> Load Roster Guests
            </button>
          </div>

          <TeamBuilder
            players={players}
            teamA={teamA}
            teamB={teamB}
            setPlayers={setPlayers}
            setTeamA={setTeamA}
            setTeamB={setTeamB}
            colorA={colorA}
            setColorA={setColorA}
            colorB={colorB}
            setColorB={setColorB}
            nameA={nameA}
            setNameA={setNameA}
            nameB={nameB}
            setNameB={setNameB}
            iconA={iconA}
            setIconA={setIconA}
            iconB={iconB}
            setIconB={setIconB}
          />

          <div style={{ marginTop: '2rem' }}>
            <ShareSection
              teamA={teamA}
              teamB={teamB}
              colorA={colorA}
              colorB={colorB}
              nameA={nameA}
              nameB={nameB}
              iconA={iconA}
              iconB={iconB}
            />
          </div>

          <MVPSelector />
        </>
      )}

      {activeTab === 'calculation' && (
        <MoneyCalculation />
      )}

      {activeTab === 'payments' && (
        <PaymentTracking />
      )}

      {activeTab === 'rosters' && (
        <RosterManagement />
      )}

      {activeTab === 'highlights' && (
        <MatchHighlights />
      )}

      <footer style={{ textAlign: 'center', marginTop: '4rem', color: '#475569', fontSize: '0.8rem', paddingBottom: '2rem' }}>
        <p>Built for the game.</p>
      </footer>
    </div>
  );
}

export default App;
