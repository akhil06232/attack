import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { summarizeTranscript } from "./lib/gemini";
import "dotenv/config";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Store session transcripts in memory (in production, use database)
const sessionTranscripts = new Map<string, string[]>();

app.prepare().then(() => {
    const httpServer = createServer(handler);

    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        console.log("Client connected", socket.id);

        socket.on("join-session", (sessionId) => {
            socket.join(sessionId);
            console.log(`Socket ${socket.id} joined session ${sessionId}`);

            // Initialize session transcript storage
            if (!sessionTranscripts.has(sessionId)) {
                sessionTranscripts.set(sessionId, []);
            }
        });

        socket.on("transcript-chunk", (data) => {
            const { sessionId, text } = data;

            if (text && text.trim()) {
                // Store the transcription
                const transcripts = sessionTranscripts.get(sessionId) || [];
                transcripts.push(text);
                sessionTranscripts.set(sessionId, transcripts);
                console.log(`Stored transcript for ${sessionId}: ${text.substring(0, 50)}...`);
            }
        });

        socket.on("stop-session", async (data) => {
            const { sessionId, transcript } = data;
            console.log(`Stopping session ${sessionId}`);

            // Use the transcript from client (more reliable than server-side chunks)
            const fullTranscript = transcript || sessionTranscripts.get(sessionId)?.join(" ") || "";

            if (fullTranscript && fullTranscript.trim()) {
                try {
                    // Generate summary
                    io.to(sessionId).emit("processing-status", { status: "Generating summary..." });
                    const summary = await summarizeTranscript(fullTranscript);

                    // Send summary to client
                    io.to(sessionId).emit("processing-complete", { summary });
                    console.log(`Summary generated for ${sessionId}`);

                    // Clean up session data
                    sessionTranscripts.delete(sessionId);
                } catch (error) {
                    console.error("Error generating summary:", error);
                    io.to(sessionId).emit("processing-complete", {
                        summary: "Error generating summary. Please try again."
                    });
                }
            } else {
                io.to(sessionId).emit("processing-complete", {
                    summary: "No transcript available to summarize. Please speak during the recording."
                });
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected", socket.id);
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
