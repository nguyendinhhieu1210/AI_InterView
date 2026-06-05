import { useState } from 'react';
import TopicSelection from '../components/TopicSelection';
import CodingInterface from '../components/CodingInterface';

export default function LiveCodingPage() {
  const [session, setSession] = useState(null);

  if (!session) {
    return <TopicSelection onSessionStart={setSession} />;
  }

  return (
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
  );
}