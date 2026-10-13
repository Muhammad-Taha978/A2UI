import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, Square, Loader } from 'lucide-react';

export default function Interview() {
  const location = useLocation();
  const navigate = useNavigate();

  const { firstQuestion, resume, jobDescription } = location.state || {};

  const [chatHistory, setChatHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (!firstQuestion) {
      navigate('/');
      return;
    }

    // Add first question to history and speak it
    setChatHistory([{ role: 'assistant', content: firstQuestion }]);
    speakText(firstQuestion);
  }, [firstQuestion, navigate]);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = handleAudioStop;
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioStop = async () => {
    setIsProcessing(true);
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

    // Create form data for transcription
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      // 1. Transcribe audio
      const transcribeRes = await fetch('http://localhost:5000/api/interview/transcribe', {
        method: 'POST',
        body: formData,
      });
      const transcribeData = await transcribeRes.json();

      if (!transcribeRes.ok) throw new Error(transcribeData.error);

      const userText = transcribeData.text;
      const newHistory = [...chatHistory, { role: 'user', content: userText }];
      setChatHistory(newHistory);

      // 2. Get next question
      const nextRes = await fetch('http://localhost:5000/api/interview/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory: newHistory, jobDescription })
      });
      const nextData = await nextRes.json();

      if (!nextRes.ok) throw new Error(nextData.error);

      const aiResponse = nextData.nextQuestion;
      setChatHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
      speakText(aiResponse);

    } catch (err) {
      console.error("Error processing turn:", err);
      alert("Failed to process your answer. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const endInterview = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('http://localhost:5000/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: null, // For MVP, no auth assumed
          resume,
          jobDescription,
          transcript: chatHistory
        })
      });

      const data = await res.json();
      if (res.ok) {
         navigate('/evaluation', { state: { evaluation: data.evaluation } });
      } else {
         throw new Error(data.error);
      }
    } catch (err) {
      console.error("Error evaluating:", err);
      alert("Failed to evaluate interview.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="bg-white p-6 rounded-xl shadow-md h-[500px] flex flex-col">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Live Interview</h2>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                <p className="text-sm font-semibold mb-1">{msg.role === 'user' ? 'You' : 'AI Interviewer'}</p>
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg flex items-center gap-2">
                <Loader className="animate-spin" size={16} />
                <span className="text-sm">Processing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="border-t pt-4 flex items-center justify-between">
          <div className="flex gap-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-full font-semibold transition-colors disabled:opacity-50"
              >
                <Mic size={18} /> Start Speaking
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white py-2 px-4 rounded-full font-semibold transition-colors animate-pulse"
              >
                <Square size={18} /> Stop & Submit
              </button>
            )}
          </div>

          <button
            onClick={endInterview}
            disabled={isProcessing || chatHistory.length < 2}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            End Interview
          </button>
        </div>
      </div>
    </div>
  );
}
