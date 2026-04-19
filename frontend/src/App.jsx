import { useState } from "react";
import ChatBox from "./components/ChatBox";
import Message from "./components/Message";
import ResultCard from "./components/ResultCard";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async (input) => {
    const userMsg = {
      type: "user",
      text: `Disease of Interest: ${input.disease}\nAdditional Query: ${input.query}\nLocation: ${input.location}`
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        const errMsg = data?.error || "Request failed";
        setMessages((prev) => [...prev, { type: "bot", text: `Error: ${errMsg}` }]);
        return;
      }

      setResults(data.data);
      setMessages((prev) => [...prev, { type: "bot", text: data.data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error: Unable to connect to backend service." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="hero-kicker">Clinical Research Navigator</p>
        <h1>Curalink AI Assistant</h1>
        <p className="hero-subtitle">
          Enter disease, focused query, and location to get publication and trial insights.
        </p>
      </header>

      <main className="layout-grid">
        <section className="panel panel-chat">
          <div className="panel-header">
            <h2>Conversation</h2>
            {loading && <span className="status-pill">Analyzing...</span>}
          </div>

          <div className="chat-window">
            {messages.length === 0 && (
              <p className="empty-state">
                Start with: Parkinson&apos;s disease, Deep Brain Stimulation, Toronto, Canada.
              </p>
            )}

            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
          </div>

          <ChatBox onSend={handleSend} loading={loading} />
        </section>

        <section className="panel panel-results">
          <div className="panel-header">
            <h2>Research Papers</h2>
          </div>
          <div className="results-list">
            {results?.publications?.length ? (
              results.publications.map((p, i) => <ResultCard key={`pub-${i}`} data={p} />)
            ) : (
              <p className="empty-state">No publications yet.</p>
            )}
          </div>

          <div className="panel-header section-gap">
            <h2>Clinical Trials</h2>
          </div>
          <div className="results-list">
            {results?.trials?.length ? (
              results.trials.map((t, i) => <ResultCard key={`trial-${i}`} data={t} />)
            ) : (
              <p className="empty-state">No trials yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
