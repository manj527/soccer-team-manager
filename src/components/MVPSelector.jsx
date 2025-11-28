import React, { useState } from 'react';
import { Trophy, Star, X } from 'lucide-react';
import './MVPSelector.css';

export function MVPSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [input, setInput] = useState('');
    const [mvpNames, setMvpNames] = useState([]);

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    const handleConfirm = () => {
        if (!input.trim()) return;
        // Split by comma or newline
        const names = input.split(/[\n,]/).map(n => n.trim()).filter(n => n.length > 0);
        setMvpNames(names);
        setIsOpen(false);
        setShowCelebration(true);
    };

    const [hideUI, setHideUI] = useState(false);

    const closeCelebration = (e) => {
        // Prevent closing if clicking the camera button
        if (e.target.closest('.camera-toggle')) return;
        setShowCelebration(false);
        setHideUI(false);
    };

    return (
        <>
            <div className="mvp-trigger-container">
                <button className="mvp-btn" onClick={handleOpen}>
                    <Trophy size={20} className="trophy-icon" />
                    Select MVP of the Day
                </button>
            </div>

            {/* Input Modal */}
            {isOpen && (
                <div className="mvp-modal-overlay">
                    <div className="mvp-modal">
                        <button className="close-modal-btn" onClick={handleClose}>
                            <X size={20} />
                        </button>
                        <h3>Select MVP(s)</h3>
                        <p>Enter the name(s) of today's best players.</p>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="e.g. Lionel Messi&#10;Cristiano Ronaldo"
                            rows={3}
                            className="mvp-input"
                        />
                        <button className="confirm-mvp-btn" onClick={handleConfirm}>
                            Confirm & Celebrate!
                        </button>
                    </div>
                </div>
            )}

            {/* Celebration Overlay */}
            {showCelebration && (
                <div className="celebration-overlay" onClick={closeCelebration}>
                    <div className="confetti-container">
                        {[...Array(50)].map((_, i) => (
                            <span key={i} className="confetti-piece" style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                animationDuration: `${Math.random() * 3 + 2}s`,
                                fontSize: `${Math.random() * 1.5 + 1}rem`
                            }}>
                                {['🎉', '🎊', '🏆', '⚽', '⭐'][Math.floor(Math.random() * 5)]}
                            </span>
                        ))}
                    </div>

                    <div className="celebration-content">
                        <div className="trophy-wrapper">
                            <Trophy size={80} color="#fbbf24" strokeWidth={1.5} />
                        </div>
                        <h1 className="mvp-title">MVP OF THE DAY</h1>
                        <div className="mvp-names-list">
                            {mvpNames.map((name, index) => (
                                <div key={index} className="mvp-name-item">
                                    <Star size={24} className="star-icon" fill="#fbbf24" />
                                    <span>{name}</span>
                                    <Star size={24} className="star-icon" fill="#fbbf24" />
                                </div>
                            ))}
                        </div>

                        {!hideUI && (
                            <div className="celebration-controls">
                                <p className="tap-close">Tap anywhere to close</p>
                                <button
                                    className="camera-toggle"
                                    onClick={() => setHideUI(true)}
                                    title="Hide UI for Screenshot"
                                >
                                    📷 Clean Mode
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
