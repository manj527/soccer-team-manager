import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Shield, Swords, Crown, Skull, Star, Zap, User, X, ArrowRight, ArrowLeft, GripVertical } from 'lucide-react';
import './TeamBuilder.css';

const ICONS = {
    shield: Shield,
    swords: Swords,
    crown: Crown,
    skull: Skull,
    star: Star,
    zap: Zap,
};

// Sortable Item Component
function SortablePlayerItem({ player, team, colorA, colorB, nameA, nameB, moveToTeam, handleDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: player.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
        position: 'relative',
    };

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, borderLeft: `4px solid ${team === 'A' ? colorA : colorB}` }}
            className="player-card-row"
        >
            <div
                className="drag-handle"
                {...attributes}
                {...listeners}
            >
                <GripVertical size={16} />
            </div>

            <span className="player-name-text">{player.name}</span>

            <div className="player-actions">
                {team === 'A' && (
                    <button className="action-icon-btn" onClick={() => moveToTeam(player, 'A', 'B')} title={`Move to ${nameB}`}>
                        <ArrowRight size={18} />
                    </button>
                )}
                {team === 'B' && (
                    <button className="action-icon-btn" onClick={() => moveToTeam(player, 'B', 'A')} title={`Move to ${nameA}`}>
                        <ArrowLeft size={18} />
                    </button>
                )}
                <button className="delete-icon-btn" onClick={() => handleDelete(player, team)}>
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

// Regular Item for Unassigned (no drag needed usually, or can add later)
function UnassignedPlayerItem({ player, colorA, colorB, moveToTeam, handleDelete }) {
    return (
        <div className="player-card-row unassigned-row" style={{ borderLeft: `4px solid #64748b` }}>
            <span className="player-name-text">{player.name}</span>
            <div className="player-actions">
                <button className="action-icon-btn" onClick={() => moveToTeam(player, 'unassigned', 'A')} style={{ color: colorA }}>A</button>
                <button className="action-icon-btn" onClick={() => moveToTeam(player, 'unassigned', 'B')} style={{ color: colorB }}>B</button>
                <button className="delete-icon-btn" onClick={() => handleDelete(player, 'unassigned')}>
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

export function TeamBuilder({
    players,
    teamA,
    teamB,
    setPlayers,
    setTeamA,
    setTeamB,
    colorA,
    setColorA,
    colorB,
    setColorB,
    nameA,
    setNameA,
    nameB,
    setNameB,
    iconA,
    setIconA,
    iconB,
    setIconB,
}) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        // Check which list the item is in
        const isTeamA = teamA.find(p => p.id === active.id);
        const isTeamB = teamB.find(p => p.id === active.id);

        if (isTeamA) {
            setTeamA((items) => {
                const oldIndex = items.findIndex(p => p.id === active.id);
                const newIndex = items.findIndex(p => p.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        } else if (isTeamB) {
            setTeamB((items) => {
                const oldIndex = items.findIndex(p => p.id === active.id);
                const newIndex = items.findIndex(p => p.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const moveToTeam = (player, fromTeam, toTeam) => {
        // Remove from source
        if (fromTeam === 'unassigned') setPlayers(prev => prev.filter(p => p.id !== player.id));
        if (fromTeam === 'A') setTeamA(prev => prev.filter(p => p.id !== player.id));
        if (fromTeam === 'B') setTeamB(prev => prev.filter(p => p.id !== player.id));

        // Add to target
        if (toTeam === 'unassigned') setPlayers(prev => [...prev, player]);
        if (toTeam === 'A') setTeamA(prev => [...prev, player]);
        if (toTeam === 'B') setTeamB(prev => [...prev, player]);
    };

    const handleDelete = (player, fromTeam) => {
        if (fromTeam === 'unassigned') setPlayers(prev => prev.filter(p => p.id !== player.id));
        if (fromTeam === 'A') setTeamA(prev => prev.filter(p => p.id !== player.id));
        if (fromTeam === 'B') setTeamB(prev => prev.filter(p => p.id !== player.id));
    };

    const handleShuffle = () => {
        const all = [...players, ...teamA, ...teamB];
        for (let i = all.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [all[i], all[j]] = [all[j], all[i]];
        }
        const half = Math.ceil(all.length / 2);
        setTeamA(all.slice(0, half));
        setTeamB(all.slice(half));
        setPlayers([]);
    };

    const IconSelector = ({ selected, onSelect }) => (
        <div className="icon-selector">
            {Object.entries(ICONS).map(([key, Icon]) => (
                <button
                    key={key}
                    onClick={() => onSelect(key)}
                    className={`icon-btn ${selected === key ? 'selected' : ''}`}
                >
                    <Icon size={16} />
                </button>
            ))}
        </div>
    );

    const TeamHeader = ({ name, setName, color, setColor, icon, setIcon, count, align }) => {
        const SelectedIcon = ICONS[icon] || Shield;
        return (
            <div className="team-header-block">
                <div className="team-header-top">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="color-picker"
                    />
                    <div className="team-name-wrapper">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="team-name-input"
                            style={{ textAlign: align }}
                            placeholder="Enter Team Name"
                        />
                        <span className="edit-hint">✎</span>
                    </div>
                </div>
                <div className="team-header-bottom">
                    <IconSelector selected={icon} onSelect={setIcon} />
                    <span className="team-count-badge" style={{ backgroundColor: color }}>
                        {count}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="team-builder-container">

                <div className="controls-row">
                    <div className="vs-badge">VS</div>
                    <button onClick={handleShuffle} className="shuffle-btn">
                        <Zap size={16} /> Shuffle Teams
                    </button>
                </div>

                <div className="columns-container">
                    {/* Team A Column */}
                    <div className="team-column-box">
                        <TeamHeader
                            name={nameA}
                            setName={setNameA}
                            color={colorA}
                            setColor={setColorA}
                            icon={iconA}
                            setIcon={setIconA}
                            count={teamA.length}
                            align="left"
                        />
                        <div className="team-list-container" style={{ backgroundColor: `${colorA}10` }}>
                            <SortableContext
                                items={teamA.map(p => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {teamA.map((p) => (
                                    <SortablePlayerItem
                                        key={p.id}
                                        player={p}
                                        team="A"
                                        colorA={colorA}
                                        colorB={colorB}
                                        nameA={nameA}
                                        nameB={nameB}
                                        moveToTeam={moveToTeam}
                                        handleDelete={handleDelete}
                                    />
                                ))}
                            </SortableContext>
                            {teamA.length === 0 && <div className="empty-msg">Empty</div>}
                        </div>
                    </div>

                    {/* Team B Column */}
                    <div className="team-column-box">
                        <TeamHeader
                            name={nameB}
                            setName={setNameB}
                            color={colorB}
                            setColor={setColorB}
                            icon={iconB}
                            setIcon={setIconB}
                            count={teamB.length}
                            align="right"
                        />
                        <div className="team-list-container" style={{ backgroundColor: `${colorB}10` }}>
                            <SortableContext
                                items={teamB.map(p => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {teamB.map((p) => (
                                    <SortablePlayerItem
                                        key={p.id}
                                        player={p}
                                        team="B"
                                        colorA={colorA}
                                        colorB={colorB}
                                        nameA={nameA}
                                        nameB={nameB}
                                        moveToTeam={moveToTeam}
                                        handleDelete={handleDelete}
                                    />
                                ))}
                            </SortableContext>
                            {teamB.length === 0 && <div className="empty-msg">Empty</div>}
                        </div>
                    </div>
                </div>

                {/* Unassigned Pool */}
                {players.length > 0 && (
                    <div className="unassigned-pool">
                        <h3>Unassigned / Bench ({players.length})</h3>
                        <div className="pool-grid">
                            {players.map(p => (
                                <UnassignedPlayerItem
                                    key={p.id}
                                    player={p}
                                    colorA={colorA}
                                    colorB={colorB}
                                    moveToTeam={moveToTeam}
                                    handleDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </DndContext>
    );
}
