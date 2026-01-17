import React, { useState, useRef } from 'react';
import { Trophy, Star, X, Download, Loader2, Edit2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import './MVPSelector.css';

export function MVPSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    // State for the input form: list of award entries
    const [awardEntries, setAwardEntries] = useState([
        { id: 1, title: 'MVP OF THE DAY', names: '' }
    ]);

    // State for the celebration view: processed list of awards
    const [celebrationAwards, setCelebrationAwards] = useState([]);

    // GIF Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const celebrationRef = useRef(null);

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    const addAwardEntry = () => {
        setAwardEntries([
            ...awardEntries,
            { id: Date.now(), title: '', names: '' }
        ]);
    };

    const removeAwardEntry = (id) => {
        if (awardEntries.length === 1) return;
        setAwardEntries(awardEntries.filter(entry => entry.id !== id));
    };

    const updateAwardEntry = (id, field, value) => {
        setAwardEntries(awardEntries.map(entry =>
            entry.id === id ? { ...entry, [field]: value } : entry
        ));
    };

    const handleConfirm = () => {
        // Process entries: filter out empty ones and split names
        const processedAwards = awardEntries
            .map(entry => ({
                title: entry.title || 'MVP OF THE DAY',
                names: entry.names.split(/[\n,]/).map(n => n.trim()).filter(n => n.length > 0)
            }))
            .filter(award => award.names.length > 0);

        if (processedAwards.length === 0) return;

        setCelebrationAwards(processedAwards);
        setIsOpen(false);
        setShowCelebration(true);
    };

    const [hideUI, setHideUI] = useState(false);

    const closeCelebration = (e) => {
        // Prevent closing if clicking controls
        if (e.target.closest('.camera-toggle') ||
            e.target.closest('.download-gif-btn') ||
            e.target.closest('.close-celebration-btn') ||
            e.target.closest('.edit-celebration-btn') ||
            isRecording) return;

        // If UI is hidden (Clean Mode), clicking anywhere restores it
        if (hideUI) {
            setHideUI(false);
            return;
        }

        // Otherwise, do nothing (require explicit close) or keep "tap to close"?
        // User asked for "close option", so let's make it explicit and maybe disable "tap to close" to avoid accidents,
        // OR keep "tap to close" but make sure the Close button is visible.
        // Let's keep "tap to close" for convenience but add the button.
        setShowCelebration(false);
        setHideUI(false);
    };

    const handleEdit = () => {
        setShowCelebration(false);
        setIsOpen(true);
    };

    const handleDownloadGif = async () => {
        console.log("Starting GIF download...");
        if (isRecording || !celebrationRef.current) {
            console.log("Cannot start: isRecording=", isRecording, "ref=", celebrationRef.current);
            return;
        }

        setIsRecording(true);
        setRecordingProgress(0);
        setHideUI(true); // Hide UI for clean capture

        try {
            const element = celebrationRef.current;
            // Create a GIF encoder
            const gif = GIFEncoder();

            const frames = 20; // Reduced to 20 frames for faster testing (2 seconds)
            const width = element.offsetWidth;
            const height = element.offsetHeight;

            console.log(`Capturing ${frames} frames from ${width}x${height} element`);

            for (let i = 0; i < frames; i++) {
                const canvas = await html2canvas(element, {
                    backgroundColor: null,
                    scale: 1,
                    useCORS: true,
                    logging: false,
                    width: width,
                    height: height,
                    ignoreElements: (node) => {
                        return node.classList && (
                            node.classList.contains('celebration-controls') ||
                            node.classList.contains('close-celebration-btn') ||
                            node.classList.contains('edit-celebration-btn')
                        );
                    }
                });

                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, width, height);
                const { data } = imageData;

                // Quantize colors to a 256-color palette
                const palette = quantize(data, 256);

                // Map pixels to palette indices
                const index = applyPalette(data, palette);

                // Write frame to GIF
                gif.writeFrame(index, width, height, {
                    palette,
                    delay: 100 // 100ms delay = 10fps
                });

                setRecordingProgress(Math.round(((i + 1) / frames) * 100));

                // Wait a bit to let the animation progress
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log("Finished capturing. Encoding...");
            gif.finish();
            const buffer = gif.bytes();
            const blob = new Blob([buffer], { type: 'image/gif' });
            console.log("GIF generated, size:", blob.size);

            // Download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `mvp-celebration-${Date.now()}.gif`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error generating GIF:", error);
            alert("Failed to generate GIF. See console for details.");
        } finally {
            setIsRecording(false);
            setHideUI(false);
            setRecordingProgress(0);
        }
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
                        <h3>Select Awards</h3>
                        <p>Customize titles and enter names for each award.</p>

                        <div className="awards-input-list">
                            {awardEntries.map((entry, index) => (
                                <div key={entry.id} className="award-entry-group">
                                    <div className="award-header">
                                        <span className="award-number">#{index + 1}</span>
                                        {awardEntries.length > 1 && (
                                            <button
                                                className="remove-award-btn"
                                                onClick={() => removeAwardEntry(entry.id)}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="input-group">
                                        <label>Award Title</label>
                                        <input
                                            type="text"
                                            value={entry.title}
                                            onChange={(e) => updateAwardEntry(entry.id, 'title', e.target.value)}
                                            placeholder="e.g. Best Goal"
                                            className="mvp-input title-input"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>Names / Tags</label>
                                        <textarea
                                            value={entry.names}
                                            onChange={(e) => updateAwardEntry(entry.id, 'names', e.target.value)}
                                            placeholder="e.g. Lionel Messi"
                                            rows={2}
                                            className="mvp-input"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="add-award-btn" onClick={addAwardEntry}>
                            + Add Another Award
                        </button>

                        <button className="confirm-mvp-btn" onClick={handleConfirm}>
                            Confirm & Celebrate!
                        </button>
                    </div>
                </div>
            )}

            {/* Celebration Overlay */}
            {showCelebration && (
                <div className="celebration-overlay" onClick={closeCelebration} ref={celebrationRef}>
                    {!hideUI && (
                        <div className="top-controls">
                            <button className="edit-celebration-btn" onClick={handleEdit} title="Edit Awards">
                                <Edit2 size={20} />
                            </button>
                            <button className="close-celebration-btn" onClick={() => setShowCelebration(false)} title="Close">
                                <X size={24} />
                            </button>
                        </div>
                    )}

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

                    <div className="celebration-content scrollable-content">
                        <div className="trophy-wrapper">
                            <Trophy size={80} color="#fbbf24" strokeWidth={1.5} />
                        </div>

                        {celebrationAwards.map((award, awardIndex) => (
                            <div key={awardIndex} className="award-section">
                                <h1 className="mvp-title">{award.title}</h1>

                                <div className="hanging-thread"></div>
                                <div className="mvp-names-list hanging-list">
                                    {award.names.map((name, index) => (
                                        <div key={index} className="mvp-name-item hanging-tag" style={{ animationDelay: `${index * 0.1}s` }}>
                                            <div className="tag-hole"></div>
                                            <div className="tag-string"></div>
                                            <div className="tag-content">
                                                <Star size={16} className="star-icon-small" fill="#fbbf24" />
                                                <span>{name}</span>
                                                <Star size={16} className="star-icon-small" fill="#fbbf24" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {!hideUI && (
                            <div className="celebration-controls">
                                <p className="tap-close">Tap anywhere to close</p>
                                <div className="control-buttons">
                                    <button
                                        className="camera-toggle"
                                        onClick={() => setHideUI(true)}
                                        title="Hide UI for Screenshot"
                                    >
                                        📷 Clean Mode
                                    </button>
                                    <button
                                        className="download-gif-btn"
                                        onClick={handleDownloadGif}
                                        disabled={isRecording}
                                        title="Record and Download GIF"
                                    >
                                        {isRecording ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                {recordingProgress}%
                                            </>
                                        ) : (
                                            <>
                                                <Download size={16} />
                                                GIF
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
