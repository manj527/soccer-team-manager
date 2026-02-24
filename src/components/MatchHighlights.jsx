import React, { useState, useRef } from 'react';
import { Newspaper, Plus, Trash2, Camera, X, Download, Share2, Star, Trophy, Target, ShieldCheck, Heart } from 'lucide-react';
import html2canvas from 'html2canvas';
import './MatchHighlights.css';

const HIGHLIGHT_TYPES = [
    { id: 'goal', label: 'Great Goal', icon: Target, color: '#ef4444' },
    { id: 'save', label: 'Amazing Save', icon: ShieldCheck, color: '#3b82f6' },
    { id: 'mvp', label: 'Special Mention', icon: Trophy, color: '#fbbf24' },
    { id: 'welcome', label: 'Welcome', icon: Star, color: '#a78bfa' },
    { id: 'thanks', label: 'Special Thanks', icon: Heart, color: '#ec4899' },
    { id: 'dunkin', label: 'Dunkin Story', icon: Heart, color: '#ff6719' }, // Dunkin Orange
];

export const MatchHighlights = React.memo(() => {
    const [highlights, setHighlights] = useState([
        { id: Date.now(), type: 'goal', title: 'Top Corner Screamer!', details: 'What a finish from outside the box!', photo: null }
    ]);
    const [dunkinStories, setDunkinStories] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const magazineRef = useRef(null);

    const addHighlight = () => {
        setHighlights([
            ...highlights,
            { id: Date.now(), type: 'goal', title: '', details: '', photo: null }
        ]);
    };

    const updateHighlight = (id, field, value) => {
        setHighlights(highlights.map(h => h.id === id ? { ...h, [field]: value } : h));
    };

    const removeHighlight = (id) => {
        if (highlights.length === 1) return;
        setHighlights(highlights.filter(h => h.id !== id));
    };

    const handlePhotoUpload = (id, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateHighlight(id, 'photo', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExport = async () => {
        if (!magazineRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(magazineRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `match-highlights-${new Date().toISOString().split('T')[0]}.png`;
            link.click();
        } catch (err) {
            console.error('Failed to export magazine:', err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="highlights-container">
            <div className="highlights-editor">
                <h2><Newspaper size={24} style={{ display: 'inline', marginRight: '8px' }} /> Match Day Highlights</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Capture the best moments of the game to create a magazine-style recap.
                </p>

                {highlights.map((h, index) => (
                    <div key={h.id} className="highlight-entry">
                        <div className="highlight-entry-header">
                            <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>#{index + 1} Highlight</span>
                            <button className="delete-icon-btn" onClick={() => removeHighlight(h.id)}>
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {HIGHLIGHT_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => updateHighlight(h.id, 'type', type.id)}
                                    className={`btn-secondary ${h.type === type.id ? 'selected' : ''}`}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        fontSize: '0.8rem',
                                        backgroundColor: h.type === type.id ? type.color : 'rgba(255,255,255,0.05)',
                                        color: h.type === type.id ? 'white' : 'var(--text-primary)',
                                        borderColor: h.type === type.id ? type.color : '#334155'
                                    }}
                                >
                                    <type.icon size={14} /> {type.label}
                                </button>
                            ))}
                        </div>

                        <input
                            type="text"
                            value={h.title}
                            onChange={(e) => updateHighlight(h.id, 'title', e.target.value)}
                            placeholder="Catchy Headline"
                        />
                        <textarea
                            value={h.details}
                            onChange={(e) => updateHighlight(h.id, 'details', e.target.value)}
                            placeholder="Tell the story..."
                            rows={2}
                        />

                        <div className="photo-upload-container">
                            <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                                <Camera size={18} /> {h.photo ? 'Change Photo' : 'Add Photo'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handlePhotoUpload(h.id, e)}
                                    style={{ display: 'none' }}
                                />
                            </label>

                            {h.photo && (
                                <div className="photo-preview-wrapper">
                                    <img src={h.photo} alt="Preview" className="photo-preview" />
                                    <button className="remove-photo-btn" onClick={() => updateHighlight(h.id, 'photo', null)}>
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                <button className="btn-secondary" onClick={addHighlight} style={{ borderStyle: 'dashed' }}>
                    <Plus size={18} /> Add Highlight
                </button>

                <div className="dunkin-editor-section" style={{ marginTop: '1.5rem', padding: '1rem', border: '2px solid #ff6719', borderRadius: '8px', background: 'rgba(255, 103, 25, 0.05)' }}>
                    <h3 style={{ color: '#ff6719', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ☕🍩 Dunkin' Stories
                    </h3>
                    <textarea
                        value={dunkinStories}
                        onChange={(e) => setDunkinStories(e.target.value)}
                        placeholder="Share chats, jokes, or events from Dunkin'..."
                        rows={3}
                        style={{ marginTop: '0.5rem' }}
                    />
                </div>

                <button className="btn-primary" onClick={() => setShowPreview(true)} style={{ marginTop: '1rem', backgroundColor: '#1a1a1a' }}>
                    <Newspaper size={20} /> Preview Magazine
                </button>
            </div>

            {showPreview && (
                <div className="magazine-overlay">
                    <div className="magazine-card">
                        <div className="magazine-canvas" ref={magazineRef}>
                            <header className="magazine-header">
                                <span className="magazine-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                <h1 className="magazine-masthead">NJSC MATCH DAY HIGHLIGHTS</h1>
                                <div style={{ borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    LOCAL SOCCER SPECIAL EDITION • VOLUME 1 • ISSUE 1
                                </div>
                            </header>

                            <div className="magazine-grid">
                                {highlights.map((h, i) => (
                                    <div key={h.id} className={i === 0 ? 'main-highlight' : 'highlight-article'}>
                                        <h3 style={{ color: HIGHLIGHT_TYPES.find(t => t.id === h.type)?.color }}>
                                            {HIGHLIGHT_TYPES.find(t => t.id === h.type)?.label}
                                        </h3>
                                        <h2>{h.title || 'Breaking News!'}</h2>
                                        {h.photo && (
                                            <div className="highlight-image-box">
                                                <img src={h.photo} alt="Story" />
                                            </div>
                                        )}
                                        <p className="article-content">{h.details || 'More details to follow as the story develops...'}</p>
                                    </div>
                                ))}

                                {dunkinStories && (
                                    <div className="dunkin-magazine-section">
                                        <div className="dunkin-banner">
                                            <span>☕</span>
                                            <h4>DUNKIN' STORIES</h4>
                                            <span>🍩</span>
                                        </div>
                                        <div className="dunkin-content">
                                            {dunkinStories.split('\n').map((line, i) => (
                                                <p key={i}>{line}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <footer style={{ marginTop: '2rem', borderTop: '2px solid #1a1a1a', paddingTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>
                                Generated by Soccer Team Manager Highlights
                            </footer>
                        </div>
                    </div>

                    <div className="magazine-actions">
                        <button className="btn-primary" onClick={handleExport} disabled={isExporting}>
                            {isExporting ? 'Exporting...' : <><Download size={20} /> Save Image</>}
                        </button>
                        <button className="btn-secondary" onClick={() => setShowPreview(false)} style={{ backgroundColor: 'white', color: 'black' }}>
                            <X size={20} /> Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});
