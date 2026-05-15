import { useState } from 'react';

export default function ApiKeyScreen({ onSubmit }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      setError('API key should start with "sk-ant-"');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className="screen">
      <div className="center-box">
        <h1 className="title-main">Depths of Ashveil</h1>
        <p className="title-sub">An AI-Driven LitRPG</p>
        <p className="intro-text">
          A living narrative powered by Claude AI. Every choice you make shapes
          the world, remembered by an AI narrator who never forgets a debt or a
          kindness.
        </p>
        <form onSubmit={handleSubmit} className="key-form">
          <input
            type="password"
            placeholder="sk-ant-api03-..."
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError('');
            }}
            className="text-input"
            autoComplete="off"
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary">
            Enter the Mine
          </button>
        </form>
        <p className="key-note">
          Your key is held in memory only — never stored or sent anywhere except
          Anthropic&rsquo;s API.
        </p>
      </div>
    </div>
  );
}
