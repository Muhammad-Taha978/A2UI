import { useLocation, useNavigate } from 'react-router-dom';

export default function Evaluation() {
  const location = useLocation();
  const navigate = useNavigate();

  const { evaluation } = location.state || {};

  if (!evaluation) {
    return (
      <div className="text-center mt-20">
        <p className="text-xl">No evaluation data found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 underline">Return Home</button>
      </div>
    );
  }

  const { score, metrics, idealVsActual } = evaluation;

  return (
    <div className="max-w-4xl mx-auto mt-6 space-y-6 pb-12">
      <div className="bg-white p-8 rounded-xl shadow-md text-center">
        <h1 className="text-3xl font-bold mb-2">Interview Evaluation</h1>
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 text-blue-600 text-4xl font-bold mt-4 border-4 border-blue-500">
          {score}/10
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <h3 className="text-gray-500 font-semibold mb-2">Technical Accuracy</h3>
          <p className="text-2xl font-bold">{metrics.technicalAccuracy}/10</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <h3 className="text-gray-500 font-semibold mb-2">Communication</h3>
          <p className="text-2xl font-bold">{metrics.communicationSkills}/10</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <h3 className="text-gray-500 font-semibold mb-2">JD Relevance</h3>
          <p className="text-2xl font-bold">{metrics.relevanceToJD}/10</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6">Detailed Feedback (Ideal vs Actual)</h2>
        <div className="space-y-8">
          {idealVsActual.map((item, idx) => (
            <div key={idx} className="border-b pb-6 last:border-b-0 last:pb-0">
              <h3 className="font-semibold text-lg mb-3">Q: {item.question}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Your Answer Summary</span>
                  <p className="mt-1 text-sm text-gray-800">{item.candidateAnswer}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Ideal Answer</span>
                  <p className="mt-1 text-sm text-gray-800">{item.idealAnswer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => navigate('/')}
          className="bg-gray-800 text-white py-3 px-8 rounded-lg font-bold hover:bg-gray-900 transition-colors"
        >
          Start New Interview
        </button>
      </div>
    </div>
  );
}
