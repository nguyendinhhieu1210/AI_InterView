import { useState, useEffect } from 'react';
import { Brain, Loader2 } from 'lucide-react';

export const AIFeedback = () => {
    const [feedback, setFeedback] = useState('Your AI coach will analyze your interviews and provide personalized tips here.');
    const [loading, setLoading] = useState(false);

    const fetchFeedback = async () => {
        setLoading(true);
        setTimeout(() => {
            setFeedback("Great progress! Focus on improving your problem-solving speed. Try to structure answers using STAR method.");
            setLoading(false);
        }, 1000);
    };

    useEffect(() => {
        fetchFeedback();
    }, []);

    return (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-semibold text-gray-800 dark:text-white">AI Coach Feedback</h4>
            </div>
            {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
            ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">{feedback}</p>
            )}
            <button onClick={fetchFeedback} className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                Refresh advice
            </button>
        </div>
    );
};