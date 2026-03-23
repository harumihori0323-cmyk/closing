import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchCustomers, getRealtimeResponse } from "../api";
import type { Customer } from "../types";

interface TranscriptEntry {
  text: string;
  timestamp: string;
  aiResponse?: string;
  aiLoading?: boolean;
}

// Web Speech API の型定義
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
    SpeechRecognition: new () => SpeechRecognition;
  }
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }
}

export default function LiveSession() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const shouldRestartRef = useRef(false);

  useEffect(() => {
    fetchCustomers().then((list: Customer[]) => {
      const found = list.find((c) => c.id === id);
      setCustomer(found || null);
      setLoading(false);
    });
  }, [id]);

  // 自動スクロール
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts, interimText]);

  const getFullTranscript = useCallback(() => {
    return transcripts.map((t) => `相手: ${t.text}`).join("\n");
  }, [transcripts]);

  const requestAiResponse = useCallback(
    async (entryIndex: number, utterance: string) => {
      if (!customer) return;
      try {
        const result = await getRealtimeResponse(
          customer as unknown as Record<string, string>,
          getFullTranscript(),
          utterance
        );
        setTranscripts((prev) =>
          prev.map((t, i) =>
            i === entryIndex ? { ...t, aiResponse: result.response, aiLoading: false } : t
          )
        );
      } catch {
        setTranscripts((prev) =>
          prev.map((t, i) =>
            i === entryIndex ? { ...t, aiResponse: "AI応答の取得に失敗しました", aiLoading: false } : t
          )
        );
      }
    },
    [customer, getFullTranscript]
  );

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("このブラウザは音声認識に対応していません。Google Chromeをお使いください。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ja-JP";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const finalText = result[0].transcript.trim();
          if (finalText) {
            const now = new Date().toLocaleTimeString("ja-JP");
            setTranscripts((prev) => {
              const newEntry: TranscriptEntry = {
                text: finalText,
                timestamp: now,
                aiLoading: true,
              };
              const newTranscripts = [...prev, newEntry];
              // AI応答をリクエスト
              requestAiResponse(newTranscripts.length - 1, finalText);
              return newTranscripts;
            });
          }
          setInterimText("");
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) setInterimText(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        setIsListening(false);
        shouldRestartRef.current = false;
      }
    };

    recognition.onend = () => {
      // 自動再開（continuous モードでもブラウザが止めることがある）
      if (shouldRestartRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          shouldRestartRef.current = false;
        }
      }
    };

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;
    recognition.start();
    setIsListening(true);
  }, [requestAiResponse]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText("");
  }, []);

  if (loading) {
    return <div className="loading"><div className="spinner" /> 読み込み中...</div>;
  }

  if (!customer) {
    return <div className="card">顧客が見つかりません。<Link to="/">戻る</Link></div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>リアルタイム支援 — {customer.name}</h1>
        <Link to="/" className="btn btn-outline">終了</Link>
      </div>

      {/* 顧客サマリー */}
      <div className="card" style={{ padding: "12px 20px", fontSize: 13, color: "var(--text-light)", display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span><strong>{customer.company}</strong></span>
        <span>提案: {customer.proposal}</span>
        <span>金額: {customer.budget}</span>
      </div>

      {/* 録音コントロール */}
      <div style={{ textAlign: "center", margin: "24px 0" }}>
        {isListening ? (
          <button className="btn btn-danger" onClick={stopListening} style={{ padding: "14px 40px", fontSize: 18 }}>
            <span className="rec-dot" /> 録音停止
          </button>
        ) : (
          <button className="btn btn-success" onClick={startListening} style={{ padding: "14px 40px", fontSize: 18 }}>
            録音開始
          </button>
        )}
        <p style={{ fontSize: 13, color: "var(--text-light)", marginTop: 8 }}>
          {isListening ? "相手の発言を聞き取っています..." : "Zoomの音声を拾えるようマイクを設定してください"}
        </p>
      </div>

      {/* リアルタイム文字起こし + AI応答 */}
      <div style={{ maxHeight: "60vh", overflowY: "auto", paddingBottom: 16 }}>
        {transcripts.map((entry, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            {/* 相手の発言 */}
            <div className="card" style={{ borderLeft: "4px solid var(--accent)", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-light)", marginBottom: 4 }}>
                <span>相手の発言</span>
                <span>{entry.timestamp}</span>
              </div>
              <p style={{ fontSize: 16 }}>{entry.text}</p>
            </div>
            {/* AI推奨返答 */}
            {entry.aiLoading ? (
              <div className="card" style={{ borderLeft: "4px solid var(--success)", background: "#f0faf4" }}>
                <div className="loading" style={{ padding: 12 }}>
                  <div className="spinner" /> 最適な返答を生成中...
                </div>
              </div>
            ) : entry.aiResponse ? (
              <div className="card" style={{ borderLeft: "4px solid var(--success)", background: "#f0faf4" }}>
                <div style={{ fontSize: 12, color: "var(--success)", fontWeight: 600, marginBottom: 6 }}>
                  AI推奨返答
                </div>
                <div style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.8 }}>
                  {entry.aiResponse}
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {/* 聞き取り中テキスト */}
        {interimText && (
          <div className="card" style={{ borderLeft: "4px solid #ccc", opacity: 0.7 }}>
            <div style={{ fontSize: 12, color: "var(--text-light)", marginBottom: 4 }}>聞き取り中...</div>
            <p style={{ fontSize: 16 }}>{interimText}</p>
          </div>
        )}
        <div ref={transcriptEndRef} />
      </div>

      <style>{`
        .rec-dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          background: #fff;
          border-radius: 50%;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
