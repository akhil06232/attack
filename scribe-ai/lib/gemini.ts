import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function transcribeAudioChunk(audioBase64: string, mimeType: string = "audio/webm") {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent([
            "Transcribe the following audio accurately. Return only the transcription.",
            {
                inlineData: {
                    mimeType: mimeType,
                    data: audioBase64
                }
            }
        ]);

        return result.response.text();
    } catch (error) {
        console.error("Error transcribing audio:", error);
        return "";
    }
}

export async function summarizeTranscript(transcript: string) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Summarize this meeting: key points, action items, decisions.\n\nTranscript:\n${transcript}`);
        return result.response.text();
    } catch (error) {
        console.error("Error summarizing transcript:", error);
        return "Error generating summary.";
    }
}
