import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const SAMPLE_MEMORY = `October 31, 1924. Blackwood Manor, Hollow Creek.
To whoever inherits this house after Clara Vance is gone:

Take this tarnished brass key labeled Room 17 in the east attic. Do not turn the latch until midnight has struck. My brother Arthur Vance locked himself inside on All Hallows' Eve forty years ago, swearing he heard a church organ playing beneath the floorboards. He never opened the door again, yet every October thirty-first at dusk, a fresh orange marigold appears on the threshold outside the keyhole, damp with river silt. 

The village undertaker, Thomas Finch, swore he buried Arthur with his marigold brooch in the churchyard beside Reverend Caleb Stone. Keep the marigold dry. If the key turns from the inside, do not run.`;

const LOADING_PHRASES = [
  'Awakening Gemma 4 local neural weights...',
  'Deciphering faded ink from the past...',
  'Isolating historical names and dates...',
  'Summoning ghosts from the silence...',
  'Weaving the haunted chronicle...',
  'Distilling memories into digital amber...'
];

const STORAGE_KEY = 'wraith_archive_v1';

export default function App() {
  const [memoryInput, setMemoryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [error, setError] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [backendStatus, setBackendStatus] = useState({
    status: 'connecting',
    model: 'gemma4:e2b',
    ollamaConnected: false,
    modelInstalled: false,
    message: 'Connecting to local model...'
  });
  const [savedArchives, setSavedArchives] = useState([]);
  const [copied, setCopied] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);

  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Load saved memories from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedArchives(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not retrieve local archive:', e);
    }
  }, []);

  // Poll backend health status
  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setBackendStatus(data);
      } else {
        setBackendStatus({
          status: 'unavailable',
          model: 'gemma4:e2b',
          ollamaConnected: false,
          modelInstalled: false,
          message: `Backend returned error code ${res.status}`
        });
      }
    } catch {
      setBackendStatus({
        status: 'unavailable',
        model: 'gemma4:e2b',
        ollamaConnected: false,
        modelInstalled: false,
        message: 'Unable to reach local WRAITH backend'
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  // Cycle loading phrases
  useEffect(() => {
    let timer;
    if (loading) {
      timer = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const scrollToInput = () => {
    if (inputRef.current) {
      inputRef.current.scrollIntoView({ behavior: 'smooth' });
      inputRef.current.focus();
    }
  };

  const handleLoadSample = () => {
    setMemoryInput(SAMPLE_MEMORY);
    setError(null);
  };

  const handleClear = () => {
    setMemoryInput('');
    setError(null);
  };

  const handleSummon = async (e) => {
    e?.preventDefault();
    setError(null);

    const clean = memoryInput.trim();
    if (!clean) {
      setError('Please provide a forgotten letter, diary note, or memory to summon.');
      scrollToInput();
      return;
    }

    if (clean.length > 6000) {
      setError(`Memory exceeds 6,000 characters (currently ${clean.length}). Please shorten your entry.`);
      return;
    }

    setLoading(true);
    setLoadingPhraseIndex(0);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory: clean })
      });

      const responseText = await response.text();
      let data;
      try {
        data = responseText.trim() ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Invalid JSON response from WRAITH backend:', parseError);
        throw new Error(
          response.ok
            ? 'The backend returned an incomplete response. Please try again.'
            : `The backend returned an invalid response (HTTP ${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || `The shadows swallowed the request (HTTP ${response.status}). Please check Ollama.`
        );
      }

      const newEntry = {
        id: 'rec_' + Date.now(),
        timestamp: data.timestamp || new Date().toISOString(),
        sourceText: clean,
        analysis: data.analysis,
        model: data.model
      };

      setCurrentAnalysis(newEntry);
      saveToArchive(newEntry, false);

      // Scroll to results
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } catch (err) {
      setError(err.message || 'An eerie silence answers. Ensure Ollama is running.');
    } finally {
      setLoading(false);
    }
  };

  const saveToArchive = (entryToSave, showFeedback = true) => {
    try {
      const existing = savedArchives.filter((item) => item.id !== entryToSave.id);
      const updated = [entryToSave, ...existing];
      setSavedArchives(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (showFeedback) {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2400);
      }
    } catch (err) {
      console.error('Failed to save to local archive:', err);
    }
  };

  const handleDeleteArchive = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Cast this memory into the void forever?')) {
      const filtered = savedArchives.filter((item) => item.id !== id);
      setSavedArchives(filtered);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      if (currentAnalysis && currentAnalysis.id === id) {
        setCurrentAnalysis(null);
      }
    }
  };

  const handleOpenArchive = (item) => {
    setCurrentAnalysis(item);
    setError(null);
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCopyStory = () => {
    if (!currentAnalysis?.analysis?.story) return;
    navigator.clipboard.writeText(
      `${currentAnalysis.analysis.title.toUpperCase()}\n\n${currentAnalysis.analysis.story}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleExportEntry = (entry) => {
    const mdContent = `# ${entry.analysis.title}
*Archived on ${new Date(entry.timestamp).toLocaleString()}*
*Model: ${entry.model || 'Gemma 4 (Local)'}*

## The Haunted Tale
${entry.analysis.story}

---

## Archival Record
- **Factual Summary:** ${entry.analysis.summary}
- **People Mentioned:** ${entry.analysis.people.length > 0 ? entry.analysis.people.join(', ') : 'None explicitly named'}
- **Dates Mentioned:** ${entry.analysis.dates.length > 0 ? entry.analysis.dates.join(', ') : 'None explicitly stated'}

### Verified Source Details
${entry.analysis.facts.map((f) => `- ${f}`).join('\n')}

---

## Original Source Memory
> ${entry.sourceText.replace(/\n/g, '\n> ')}

*Preserved with WRAITH — Local-First AI Memory Archive*
`;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entry.analysis.title.replace(/[^a-z0-9_-]/gi, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Status Badge Rendering
  const renderStatusBadge = () => {
    const { status, model } = backendStatus;
    if (status === 'ready') {
      return (
        <div className="status-badge status-ready" title="Ollama connected and Gemma 4 model loaded">
          <span className="status-orb orb-green"></span>
          <span className="status-text">{model.toUpperCase()} · LOCAL AI READY</span>
        </div>
      );
    }
    if (status === 'connecting') {
      return (
        <div className="status-badge status-connecting" title="Checking local Ollama connection">
          <span className="status-orb orb-yellow"></span>
          <span className="status-text">CONNECTING TO LOCAL MODEL</span>
        </div>
      );
    }
    return (
      <div className="status-badge status-unavailable" title={backendStatus.message}>
        <span className="status-orb orb-red"></span>
        <span className="status-text">MODEL UNAVAILABLE</span>
      </div>
    );
  };

  const charCount = memoryInput.length;
  const isOverLimit = charCount > 6000;

  return (
    <div className="wraith-app">
      {/* Drifting Mist Background Layers */}
      <div className="mist-layer mist-one" aria-hidden="true"></div>
      <div className="mist-layer mist-two" aria-hidden="true"></div>

      <div className="container">
        {/* ================= A. HEADER ================= */}
        <header className="header">
          <div className="header-brand">
            <div className="title-wrapper">
              <span className="ghost-symbol" aria-hidden="true">👻</span>
              <h1 className="main-title">WRAITH</h1>
            </div>
            <p className="tagline">Every Memory Leaves a Shadow.</p>
          </div>
          <div className="header-status">
            {renderStatusBadge()}
          </div>
        </header>

        {/* ================= B. HERO SECTION ================= */}
        <section className="hero-section">
          <div className="hero-content">
            <h2 className="hero-heading">Some stories refuse to stay buried.</h2>
            <p className="hero-subtext">
              Enter a forgotten memory. Let WRAITH uncover its details and weave a haunting story from the echoes it leaves behind.
            </p>
            <div className="hero-badges">
              <span className="privacy-pill">
                <span className="shield-icon" aria-hidden="true">🔒</span>
                LOCAL INFERENCE · YOUR MEMORIES STAY ON YOUR DEVICE
              </span>
            </div>
            <div className="hero-action">
              <button className="btn-summon-scroll" onClick={scrollToInput}>
                Begin Summoning <span className="arrow-down">↓</span>
              </button>
              <button 
                type="button" 
                className="btn-poster-trigger" 
                onClick={() => setShowPosterModal(true)}
                title="Open Interactive Project Cover & Poster"
              >
                📜 Interactive Poster
              </button>
            </div>
          </div>
        </section>

        {/* ================= C. MEMORY INPUT PANEL ================= */}
        <section className="input-section" id="memory-input-section">
          <div className="card memory-input-card">
            <div className="card-header">
              <div className="card-title-group">
                <span className="quill-icon" aria-hidden="true">📜</span>
                <span className="card-label">THE ORIGINAL MEMORY</span>
              </div>
              <div className="card-actions-quick">
                <button
                  type="button"
                  className="btn-text"
                  onClick={handleLoadSample}
                  disabled={loading}
                >
                  Load Sample
                </button>
                {memoryInput && (
                  <button
                    type="button"
                    className="btn-text text-danger"
                    onClick={handleClear}
                    disabled={loading}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="textarea-wrapper">
              <textarea
                ref={inputRef}
                className={`memory-textarea ${isOverLimit ? 'has-error' : ''}`}
                rows={9}
                placeholder="A letter found beneath the floorboards, a diary from another century, a memory passed down through generations..."
                value={memoryInput}
                onChange={(e) => setMemoryInput(e.target.value)}
                disabled={loading}
                aria-label="Input forgotten memory"
              />
            </div>

            <div className="input-card-footer">
              <div className={`char-counter ${isOverLimit ? 'counter-danger' : ''}`}>
                <span>{charCount.toLocaleString()}</span> / 6,000 characters
              </div>

              <button
                type="button"
                className="btn-primary-summon"
                onClick={handleSummon}
                disabled={loading || charCount === 0 || isOverLimit}
              >
                {loading ? (
                  <span className="summoning-state">
                    <span className="ghost-spinner" aria-hidden="true">🕯️</span>
                    <span>Summoning...</span>
                  </span>
                ) : (
                  <span>Summon the Story ✦</span>
                )}
              </button>
            </div>

            {loading && (
              <div className="loading-container" role="status" aria-live="polite">
                <div className="candle-flicker-bar">
                  <div className="flicker-flame"></div>
                </div>
                <p className="loading-phrase">{LOADING_PHRASES[loadingPhraseIndex]}</p>
                <p className="loading-subphrase">Executing on local hardware with zero external cloud calls.</p>
              </div>
            )}

            {error && (
              <div className="error-alert" role="alert">
                <span className="error-icon" aria-hidden="true">⚠️</span>
                <div className="error-content">
                  <strong>The Shadow Encounters Resistance:</strong>
                  <p>{error}</p>
                  {backendStatus.status !== 'ready' && (
                    <div className="error-hint">
                      <p>💡 Tip: Ensure Ollama is active with the required model:</p>
                      <code>ollama pull {backendStatus.model || 'gemma4:e2b'}</code>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================= D. AI ANALYSIS SECTION ================= */}
        {currentAnalysis && (
          <section className="analysis-section" ref={resultsRef}>
            <div className="section-divider">
              <span className="divider-line"></span>
              <span className="divider-icon">🗝️</span>
              <span className="divider-line"></span>
            </div>

            <div className="results-wrapper">
              {/* 1. Archive Record */}
              <div className="card archive-record-card">
                <div className="card-top-banner">
                  <span className="banner-tag">ARCHIVE RECORD # {currentAnalysis.id.slice(-6)}</span>
                  <span className="banner-model">MODEL: {currentAnalysis.model || 'Gemma 4'}</span>
                </div>

                <h3 className="record-title">{currentAnalysis.analysis.title}</h3>

                <div className="record-block">
                  <h4 className="meta-heading">FACTUAL SUMMARY</h4>
                  <p className="record-summary-text">{currentAnalysis.analysis.summary}</p>
                </div>

                <div className="meta-columns">
                  <div className="meta-col">
                    <h4 className="meta-heading">PEOPLE EXPLICITLY MENTIONED</h4>
                    {currentAnalysis.analysis.people.length > 0 ? (
                      <div className="tag-group">
                        {currentAnalysis.analysis.people.map((person, idx) => (
                          <span key={idx} className="meta-tag tag-person">
                            👤 {person}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="meta-empty">No specific individuals identified in source.</p>
                    )}
                  </div>

                  <div className="meta-col">
                    <h4 className="meta-heading">DATES & TIMELINES</h4>
                    {currentAnalysis.analysis.dates.length > 0 ? (
                      <div className="tag-group">
                        {currentAnalysis.analysis.dates.map((date, idx) => (
                          <span key={idx} className="meta-tag tag-date">
                            ⏳ {date}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="meta-empty">No specific calendar dates present in source.</p>
                    )}
                  </div>
                </div>

                <div className="record-block">
                  <h4 className="meta-heading">KEY DETAILS EXTRACTED FROM SOURCE</h4>
                  {currentAnalysis.analysis.facts.length > 0 ? (
                    <ul className="facts-list">
                      {currentAnalysis.analysis.facts.map((fact, idx) => (
                        <li key={idx}>
                          <span className="fact-bullet">🕯️</span>
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="meta-empty">No isolated historical details extracted.</p>
                  )}
                </div>
              </div>

              {/* 2. The Haunted Tale */}
              <div className="card manuscript-card">
                <div className="manuscript-parchment-glow"></div>
                <div className="manuscript-header">
                  <span className="manuscript-stamp">✦ THE HAUNTED TALE ✦</span>
                  <div className="manuscript-tools">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={handleCopyStory}
                      title="Copy ghost story text"
                    >
                      {copied ? '✓ Copied' : '📋 Copy Tale'}
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleExportEntry(currentAnalysis)}
                      title="Export entry to Markdown"
                    >
                      📥 Export (.md)
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => saveToArchive(currentAnalysis)}
                      title="Re-save to local archive"
                    >
                      {justSaved ? '✓ Saved!' : '💾 Save'}
                    </button>
                  </div>
                </div>

                <h3 className="manuscript-story-title">{currentAnalysis.analysis.title}</h3>

                <div className="manuscript-story-body">
                  {currentAnalysis.analysis.story
                    .split(/\n\s*\n/)
                    .map((paragraph, index) => (
                      <p key={index} className="story-paragraph">
                        {paragraph}
                      </p>
                    ))}
                </div>

                <div className="manuscript-footer">
                  <span className="wax-seal" aria-hidden="true">🪶</span>
                  <span className="manuscript-footnote">
                    Woven from original memory fragments by Gemma 4 under local parameter inference.
                  </span>
                </div>
              </div>

              {/* 3. Source Integrity */}
              <div className="card source-integrity-card">
                <div className="integrity-header">
                  <span className="integrity-icon">⚖️</span>
                  <div>
                    <h4 className="integrity-title">SOURCE INTEGRITY & GROUNDING VERIFICATION</h4>
                    <p className="integrity-subtitle">
                      Verify the boundaries between original reality and creative supernatural weaving.
                    </p>
                  </div>
                </div>

                <div className="integrity-comparison">
                  <div className="source-box">
                    <span className="box-label">SUBMITTED SOURCE MEMORY</span>
                    <blockquote className="source-quote">
                      {currentAnalysis.sourceText}
                    </blockquote>
                  </div>

                  <div className="fiction-disclaimer-box">
                    <span className="box-label">GROUNDING POLICY NOTE</span>
                    <p className="disclaimer-text">
                      <strong>Historical Extraction:</strong> Names, dates, and extracted details directly quote or summarize the submitted text without artificial hallucinations.
                    </p>
                    <p className="disclaimer-text">
                      <strong>Supernatural Fiction:</strong> The ghostly narrative and paranormal occurrences are atmospheric creative fiction generated by the open-weight model, not historical fact.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= E. PERSONAL ARCHIVE ================= */}
        <section className="archive-section">
          <div className="archive-header-row">
            <div>
              <h2 className="section-title">THE FORGOTTEN ARCHIVE</h2>
              <p className="section-subtext">
                Preserved locally on this device. Memories linger even when the tab is closed.
              </p>
            </div>
            {savedArchives.length > 0 && (
              <span className="archive-count-badge">
                {savedArchives.length} {savedArchives.length === 1 ? 'Entry' : 'Entries'}
              </span>
            )}
          </div>

          {savedArchives.length === 0 ? (
            <div className="empty-archive-card">
              <span className="empty-ghost-icon" aria-hidden="true">🕸️</span>
              <p className="empty-message">The archive is silent. Preserve your first memory.</p>
              <button type="button" className="btn-secondary" onClick={scrollToInput}>
                Summon an Echo Now
              </button>
            </div>
          ) : (
            <div className="archive-grid">
              {savedArchives.map((item) => (
                <div
                  key={item.id}
                  className={`archive-item-card ${currentAnalysis?.id === item.id ? 'is-active-entry' : ''}`}
                  onClick={() => handleOpenArchive(item)}
                >
                  <div className="archive-card-top">
                    <span className="archive-date">
                      {new Date(item.timestamp).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <button
                      type="button"
                      className="btn-delete-card"
                      onClick={(e) => handleDeleteArchive(item.id, e)}
                      title="Delete from archive"
                      aria-label="Delete entry"
                    >
                      ✕
                    </button>
                  </div>

                  <h3 className="archive-item-title">{item.analysis.title}</h3>
                  <p className="archive-item-summary">{item.analysis.summary}</p>

                  <div className="archive-card-footer">
                    <div className="archive-tags-preview">
                      {item.analysis.people.length > 0 && (
                        <span className="mini-tag">👤 {item.analysis.people.length}</span>
                      )}
                      {item.analysis.dates.length > 0 && (
                        <span className="mini-tag">⏳ {item.analysis.dates.length}</span>
                      )}
                    </div>
                    <span className="btn-reopen-link">
                      Reopen Entry →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= F. FOOTER ================= */}
        <footer className="footer">
          <div className="footer-glow-line"></div>
          <div className="footer-content">
            <p className="footer-tagline">
              <strong>WRAITH</strong> · AN EXPERIMENT IN OPEN AI AND LIVING MEMORY
            </p>
            <p className="footer-credits">
              Powered by a locally running open-weight model through Ollama.
            </p>
            <p className="footer-privacy-note">
              No cloud accounts · Zero telemetry · 100% on-device inference via Gemma 4.
            </p>
            <div className="footer-links">
              <a
                href="https://github.com/your-username/wraith"
                target="_blank"
                rel="noreferrer"
                className="footer-link"
              >
                GitHub Repository
              </a>
              <span className="dot-sep">·</span>
              <span className="footer-edition">Ghost in the Machine Challenge Edition</span>
              <span className="dot-sep">·</span>
              <span className="footer-license">MIT License</span>
            </div>
          </div>
        </footer>
      </div>

      {/* ================= POSTER MODAL ================= */}
      {showPosterModal && (
        <div className="poster-modal-backdrop" onClick={() => setShowPosterModal(false)}>
          <div className="poster-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="poster-modal-bar">
              <span className="poster-modal-title">WRAITH 👻 — Project Cover & Interactive Poster</span>
              <div className="poster-modal-actions">
                <a 
                  href="/poster.html" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-modal-tab"
                >
                  ↗ Open in Full Tab
                </a>
                <button 
                  type="button" 
                  className="btn-modal-close" 
                  onClick={() => setShowPosterModal(false)}
                >
                  ✕ Close
                </button>
              </div>
            </div>
            <iframe 
              src="/poster.html" 
              title="WRAITH Interactive Poster" 
              className="poster-modal-iframe" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
