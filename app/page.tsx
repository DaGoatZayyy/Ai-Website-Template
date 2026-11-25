"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";

type Model = { name: string; size?: number; modified_at?: string };
type Message = { role: "user" | "assistant"; content: string; id: number };

export default function Home() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(1);

  const loadModels = useCallback(async () => {
    setModelsLoading(true);
    try {
      const response = await fetch("/api/models", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn't load Ollama models.");
      const available: Model[] = data.models ?? [];
      setModels(available);
      setSelectedModel((current) => current && available.some((model) => model.name === current)
        ? current : available[0]?.name ?? "");
      setError(available.length ? "" : "No models found. Pull one with ollama pull llama3.2.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't connect to Ollama.");
    } finally {
      setModelsLoading(false);
    }
  }, []);

  useEffect(() => { void loadModels(); }, [loadModels]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: loading ? "smooth" : "auto", block: "end" });
  }, [messages, loading]);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading || !selectedModel) return;

    const userMessage: Message = { role: "user", content: prompt, id: nextId.current++ };
    const assistantId = nextId.current++;
    setMessages((current) => [...current, userMessage, { role: "assistant", content: "", id: assistantId }]);
    setInput("");
    setLoading(true);
    setError("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const history = [...messages, userMessage].map(({ role, content }) => ({ role, content }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel, messages: history }),
      });
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "The model couldn't respond.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;
      while (!finished) {
        const { value, done } = await reader.read();
        finished = done;
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const chunk = JSON.parse(line);
          if (chunk.message?.content) {
            const piece = chunk.message.content as string;
            setMessages((current) => current.map((message) =>
              message.id === assistantId ? { ...message, content: message.content + piece } : message
            ));
          }
          if (chunk.error) throw new Error(chunk.error);
        }
      }
      if (buffer.trim()) {
        const chunk = JSON.parse(buffer);
        if (chunk.message?.content) {
          const piece = chunk.message.content as string;
          setMessages((current) => current.map((message) =>
            message.id === assistantId ? { ...message, content: message.content + piece } : message
          ));
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setMessages((current) => current.filter((item) => item.id !== assistantId));
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Ollama Chat home">
          <span className="brand-mark">✳</span><span>ollama<span className="brand-muted">.chat</span></span>
        </a>
        <div className="topbar-actions">
          <div className="model-picker">
            <span className="model-indicator" />
            <select value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)} disabled={modelsLoading || models.length === 0} aria-label="Choose a model">
              {models.length === 0 && <option value="">{modelsLoading ? "Loading models..." : "No models installed"}</option>}
              {models.map((model) => <option value={model.name} key={model.name}>{model.name}</option>)}
            </select>
            <span className="chevron">⌄</span>
          </div>
          <button className="icon-button refresh-button" onClick={() => void loadModels()} title="Refresh installed models" aria-label="Refresh models">↻</button>
          <button className="messages-button" onClick={() => { setMessages([]); setError(""); }} title="Start a new chat">
            <span className="messages-icon">▤</span><span>New chat</span>
          </button>
        </div>
      </header>

      <section className="chat-area" aria-label="Chat messages">
        {messages.length === 0 ? (
          <div className="welcome">
            <div className="welcome-icon">✳</div>
            <h1>What can I help with?</h1>
            <p>Your models. Your machine. Your conversations.</p>
            <div className="suggestions">
              {["Explain something complicated simply", "Help me write a Python script", "Give me ideas for a project"].map((suggestion) => (
                <button key={suggestion} onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}>{suggestion}<span>↗</span></button>
              ))}
            </div>
            {models.length === 0 && !modelsLoading && <p className="setup-hint">Install a model with <code>ollama pull llama3.2</code>, then refresh.</p>}
          </div>
        ) : (
          <div className="message-list">
            {messages.map((message) => (
              <article className={`message-row ${message.role}`} key={message.id}>
                {message.role === "assistant" && <div className="assistant-avatar">✳</div>}
                <div className="message-content">
                  {message.role === "user" ? <p>{message.content}</p> : (
                    message.content ? <div className="assistant-text">{message.content}</div> :
                      loading && <div className="typing-indicator" aria-label="AI is responding"><i /><i /><i /></div>
                  )}
                </div>
              </article>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </section>

      <div className="composer-wrap">
        {error && <div className="error-message" role="status">{error}</div>}
        <form className="composer" onSubmit={sendMessage}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              event.target.style.height = "auto";
              event.target.style.height = `${Math.min(event.target.scrollHeight, 180)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={selectedModel ? "Message your model..." : "Install an Ollama model to get started"}
            rows={1}
            disabled={!selectedModel || loading}
            aria-label="Message"
          />
          <div className="composer-footer">
            <span className="composer-hint">Enter to send · Shift + Enter for a new line</span>
            <button className="send-button" type="submit" disabled={!input.trim() || loading || !selectedModel} aria-label="Send message">
              {loading ? <span className="send-spinner" /> : <span>↑</span>}
            </button>
          </div>
        </form>
        <p className="footer-note">AI can make mistakes. Check important information.</p>
      </div>
    </main>
  );
}