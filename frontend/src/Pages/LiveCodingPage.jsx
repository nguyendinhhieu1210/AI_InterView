import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import TopicSelection from '../components/TopicSelection';
import CodingInterface from '../components/CodingInterface';

export default function LiveCodingPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [session, setSession] = useState(null);

  if (!session) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <TopicSelection onSessionStart={setSession} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <CodingInterface
        sessionId={session.sessionId}
        problemStatement={session.problemStatement}
        language={session.language}
        topic={session.topic}
        domain={session.domain}
        difficulty={session.difficulty}
        testCriteria={session.testCriteria || ''}
        exampleInput={session.exampleInput || ''}
        exampleOutput={session.exampleOutput || ''}
        onReset={() => setSession(null)}
      />
    </div>
  );
}