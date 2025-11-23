import React, { useState } from 'react';
import { PlayerInput } from './components/PlayerInput';
import { TeamBuilder } from './components/TeamBuilder';
import { ShareSection } from './components/ShareSection';
import { Trophy } from 'lucide-react';

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
  // Split default players 50/50 initially
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

      <PlayerInput onAddPlayers={handleAddPlayers} />

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

      <footer style={{ textAlign: 'center', marginTop: '4rem', color: '#475569', fontSize: '0.8rem', paddingBottom: '2rem' }}>
        <p>Built for the game.</p>
      </footer>
    </div>
  );
}

export default App;
