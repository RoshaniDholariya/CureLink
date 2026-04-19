import { useState } from "react";

export default function ChatBox({ onSend, loading }) {
  const [disease, setDisease] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = () => {
    if (!disease || !query || !location || loading) return;

    onSend({ disease, query, location });
    setQuery("");
  };

  return (
    <div className="chat-box">
      <label className="chat-label">Disease of Interest</label>
      <input
        className="chat-input"
        placeholder="e.g. Parkinson's disease"
        value={disease}
        onChange={(e) => setDisease(e.target.value)}
      />

      <label className="chat-label">Additional Query</label>
      <input
        className="chat-input"
        placeholder="e.g. Deep Brain Stimulation"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <label className="chat-label">Location</label>
      <input
        className="chat-input"
        placeholder="e.g. Toronto, Canada"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      <button onClick={handleSubmit} className="chat-button" disabled={loading}>
        {loading ? "Searching..." : "Search Research"}
      </button>
    </div>
  );
}
