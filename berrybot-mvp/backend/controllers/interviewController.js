const { Groq } = require('groq-sdk');
const supabase = require('../config/supabaseClient');
const fs = require('fs');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 1. Initialize Interview (Generates the first question & context)
exports.generateQuestions = async (req, res) => {
    try {
        const { resume, jobDescription } = req.body;
        if (!resume || !jobDescription) return res.status(400).json({ error: "Resume and JD required." });

        const prompt = `
        You are an expert technical interviewer. You are interviewing a candidate based on this Job Description:
        ${jobDescription}

        Candidate Resume:
        ${resume}

        Generate the FIRST interview question to kick off the interview. Make it welcoming.
        Return ONLY a JSON object: {"message": "Your welcoming first question here"}
        `;

        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const parsed = JSON.parse(completion.choices[0].message.content);
        res.status(200).json({ firstQuestion: parsed.message });
    } catch (error) {
        console.error("Error generating first question:", error);
        res.status(500).json({ error: "Failed to generate question." });
    }
};

// 2. Transcribe User Audio (STT via Groq Whisper)
exports.transcribeAudio = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No audio file uploaded." });

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(req.file.path),
            model: "whisper-large-v3",
            response_format: "json",
        });

        // Clean up the temporary audio file
        fs.unlinkSync(req.file.path);

        res.status(200).json({ text: transcription.text });
    } catch (error) {
        console.error("Transcription error:", error);
        res.status(500).json({ error: "Failed to transcribe audio." });
    }
};

// 3. Get Next Dynamic Question based on conversation history
exports.getNextQuestion = async (req, res) => {
    try {
        const { chatHistory, jobDescription } = req.body;
        // chatHistory is an array of objects: [{ role: 'system'/'user'/'assistant', content: '...' }]

        const systemMessage = {
            role: "system",
            content: `You are an expert interviewer. Review the chat history. Evaluate the candidate's last answer briefly, then ask the next logical interview question based on the Job Description: ${jobDescription}. Keep it conversational. Do not list multiple questions, just act like a human asking the next question.`
        };

        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [systemMessage, ...chatHistory]
        });

        res.status(200).json({ nextQuestion: completion.choices[0].message.content });
    } catch (error) {
        console.error("Error getting next question:", error);
        res.status(500).json({ error: "Failed to generate next question." });
    }
};

// 4. Evaluate Candidate Performance (Same as before)
exports.evaluateInterview = async (req, res) => {
    try {
        const { userId, resume, jobDescription, transcript } = req.body;

        const prompt = `
        You are an expert hiring manager. Evaluate the candidate's performance based on the interview transcript.
        Job Description: ${jobDescription}
        Candidate Resume: ${resume}
        Transcript: ${JSON.stringify(transcript)}

        Provide evaluation strictly in this JSON format:
        {
          "score": 8,
          "metrics": { "technicalAccuracy": 8, "communicationSkills": 9, "relevanceToJD": 7 },
          "idealVsActual": [
            { "question": "Q1", "candidateAnswer": "...", "idealAnswer": "..." }
          ]
        }
        `;

        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const evaluation = JSON.parse(completion.choices[0].message.content);

        // Try to save to Supabase, but don't fail the request if it errors (e.g. if the table doesn't exist)
        if (userId) {
            try {
                await supabase.from('interviews').insert([{
                    user_id: userId, job_description: jobDescription, resume_text: resume,
                    score: evaluation.score, metrics: evaluation.metrics, ideal_vs_actual: evaluation.idealVsActual
                }]);
            } catch (dbError) {
                console.error("Error saving evaluation to DB (ignoring):", dbError);
            }
        }

        res.status(200).json({ evaluation });
    } catch (error) {
        console.error("Evaluation error:", error);
        res.status(500).json({ error: "Failed to evaluate." });
    }
};
