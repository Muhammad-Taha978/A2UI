import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, Play } from 'lucide-react';

export default function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleStartInterview = async (e) => {
    e.preventDefault();
    if (!jobDescription || !resume) {
      alert("Please provide both Job Description and Resume.");
      return;
    }

    setIsLoading(true);
    try {
      // Call our backend to generate the first welcoming question
      const response = await fetch('http://localhost:5000/api/interview/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription })
      });

      const data = await response.json();

      if (response.ok) {
        // Navigate to interview page and pass state
        navigate('/interview', {
            state: {
                firstQuestion: data.firstQuestion,
                resume,
                jobDescription
            }
        });
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      alert("Failed to connect to the backend server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Set Up Your Mock Interview</h1>

      <form onSubmit={handleStartInterview} className="space-y-6">
        {/* Job Description Input */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Briefcase size={18} /> Paste Job Description
          </label>
          <textarea
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g. We are looking for a React developer with Node.js experience..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        {/* Resume Input */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <FileText size={18} /> Paste Your Resume
          </label>
          <textarea
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g. Experienced Software Engineer with 3 years building web apps..."
            value={resume}
            onChange={(e) => setResume(e.target.value)}
          />
        </div>

        {/* Start Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-blue-400"
        >
          {isLoading ? (
            "Preparing AI Interviewer..."
          ) : (
            <>
              <Play size={20} /> Start Interview
            </>
          )}
        </button>
      </form>
    </div>
  );
}
