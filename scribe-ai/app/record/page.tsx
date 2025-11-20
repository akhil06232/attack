"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Mic, Square, Pause, Play, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { io, Socket } from "socket.io-client";

type RecordingState = "idle" | "recording" | "paused" | "processing";

// Extend Window interface for webkitSpeechRecognition
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

export default function RecordPage() {
    const [state, setState] = useState<RecordingState>("idle");
    const [transcript, setTranscript] = useState<string>("");
    const [summary, setSummary] = useState<string>("");
    const [sessionId, setSessionId] = useState<string>("");
    const [audioSource, setAudioSource] = useState<"mic" | "tab">("mic");
    const [isSupported, setIsSupported] = useState(true);

    const recognitionRef = useRef<any>(null);
    const socketRef = useRef<Socket | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        // Check for Speech Recognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            console.error("Speech Recognition not supported");
        }

        // Initialize Socket.io connection
        socketRef.current = io();

        socketRef.current.on("connect", () => {
            console.log("Connected to server");
        });

        socketRef.current.on("processing-complete", (data: { summary: string }) => {
            setSummary(data.summary);
            setState("idle");
        });

        return () => {
            socketRef.current?.disconnect();
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (!SpeechRecognition) {
                alert("Speech Recognition is not supported in your browser. Please use Chrome or Edge.");
                return;
            }

            // Request microphone permission
            let stream: MediaStream;
            if (audioSource === "mic") {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } else {
                // @ts-ignore
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: false,
                    audio: true,
                });
            }
            streamRef.current = stream;

            // Initialize Speech Recognition
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            const newSessionId = `session-${Date.now()}`;
            setSessionId(newSessionId);
            socketRef.current?.emit("join-session", newSessionId);

            let finalTranscript = "";

            recognition.onresult = (event: any) => {
                let interimTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcriptPiece = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcriptPiece + " ";
                        setTranscript(finalTranscript);

                        // Send to server for storage
                        socketRef.current?.emit("transcript-chunk", {
                            sessionId: newSessionId,
                            text: transcriptPiece,
                        });
                    } else {
                        interimTranscript += transcriptPiece;
                    }
                }

                // Update UI with interim results
                setTranscript(finalTranscript + interimTranscript);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
                if (event.error === 'no-speech') {
                    console.log("No speech detected, continuing...");
                } else if (event.error === 'aborted') {
                    console.log("Recognition aborted");
                } else {
                    alert(`Speech recognition error: ${event.error}`);
                }
            };

            recognition.onend = () => {
                if (state === "recording") {
                    // Restart if still recording
                    recognition.start();
                }
            };

            recognitionRef.current = recognition;
            recognition.start();

            setState("recording");
            setTranscript("");
            setSummary("");
        } catch (error) {
            console.error("Error starting recording:", error);
            alert("Failed to start recording. Please check permissions.");
        }
    };

    const pauseRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setState("paused");
        }
    };

    const resumeRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.start();
            setState("recording");
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        streamRef.current?.getTracks().forEach((track) => track.stop());
        setState("processing");

        // Emit stop event to trigger summarization
        socketRef.current?.emit("stop-session", { sessionId, transcript });
    };

    if (!isSupported) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-slate-800 max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-red-400">Browser Not Supported</h2>
                    <p className="text-slate-300 mb-4">
                        Speech Recognition is not supported in your browser. Please use Google Chrome or Microsoft Edge.
                    </p>
                    <Link href="/" className="text-violet-400 hover:text-violet-300">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-violet-400" />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                            ScribeAI
                        </h1>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-6 py-8">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8">Recording Session</h2>

                    {/* Audio Source Selection */}
                    {state === "idle" && (
                        <div className="mb-8 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <h3 className="text-lg font-semibold mb-4">Select Audio Source</h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setAudioSource("mic")}
                                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${audioSource === "mic"
                                            ? "border-violet-500 bg-violet-500/10"
                                            : "border-slate-700 hover:border-slate-600"
                                        }`}
                                >
                                    <Mic className="w-6 h-6 mx-auto mb-2" />
                                    <div className="font-medium">Microphone</div>
                                    <div className="text-xs text-slate-400 mt-1">Recommended</div>
                                </button>
                                <button
                                    onClick={() => setAudioSource("tab")}
                                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${audioSource === "tab"
                                            ? "border-violet-500 bg-violet-500/10"
                                            : "border-slate-700 hover:border-slate-600"
                                        }`}
                                >
                                    <Sparkles className="w-6 h-6 mx-auto mb-2" />
                                    <div className="font-medium">Tab/Screen Share</div>
                                    <div className="text-xs text-slate-400 mt-1">Experimental</div>
                                </button>
                            </div>
                            <p className="text-sm text-slate-400 mt-4">
                                💡 <strong>Note:</strong> This app uses your browser&apos;s built-in speech recognition.
                                For best results, use Google Chrome and speak clearly.
                            </p>
                        </div>
                    )}

                    {/* Recording Controls */}
                    <div className="mb-8 p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                        <div className="mb-6">
                            {state === "idle" && (
                                <button
                                    onClick={startRecording}
                                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 transition-all font-semibold text-lg shadow-lg shadow-violet-500/20"
                                >
                                    <Mic className="w-6 h-6" />
                                    Start Recording
                                </button>
                            )}

                            {state === "recording" && (
                                <div className="flex items-center justify-center gap-4">
                                    <div className="flex items-center gap-2 text-red-400">
                                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                        <span className="font-medium">Recording...</span>
                                    </div>
                                    <button
                                        onClick={pauseRecording}
                                        className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors font-medium"
                                    >
                                        <Pause className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={stopRecording}
                                        className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors font-medium"
                                    >
                                        <Square className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {state === "paused" && (
                                <div className="flex items-center justify-center gap-4">
                                    <div className="flex items-center gap-2 text-yellow-400">
                                        <Pause className="w-5 h-5" />
                                        <span className="font-medium">Paused</span>
                                    </div>
                                    <button
                                        onClick={resumeRecording}
                                        className="px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors font-medium"
                                    >
                                        <Play className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={stopRecording}
                                        className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors font-medium"
                                    >
                                        <Square className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {state === "processing" && (
                                <div className="flex items-center justify-center gap-3 text-violet-400">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span className="font-medium">Processing and generating summary...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Live Transcript */}
                    {transcript && (
                        <div className="mb-8 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Mic className="w-5 h-5 text-violet-400" />
                                Live Transcript
                            </h3>
                            <div className="p-4 rounded-lg bg-slate-950/50 text-slate-300 max-h-96 overflow-y-auto">
                                {transcript}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    {summary && (
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 border border-violet-500/30">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-violet-400" />
                                AI Summary
                            </h3>
                            <div className="p-4 rounded-lg bg-slate-950/50 text-slate-300 whitespace-pre-wrap">
                                {summary}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
