const express = require('express');
const { connectDB } = require('./src/config/db');

async function run() {
  await connectDB();
  const aiRoutes = require('./src/routes/aiRoutes');

  const app = express();
  app.use(express.json());
  app.use('/api/ai', aiRoutes);
  const server = app.listen(5099, async () => {
    try {
      console.log('=== TEST 1: POST /api/ai/chat (Greeting) ===');
      const res1 = await fetch('http://localhost:5099/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          healthcareMode: 'ayush',
          communicationMode: 'voice',
          language: 'en',
        }),
      });
      console.log('Init response status:', res1.status);
      const text1 = await res1.text();
      console.log('Init raw body:', text1);
      const data1 = JSON.parse(text1);
      if (!data1.success || !data1.conversationId || !data1.nextQuestion) {
        throw new Error('Greeting failed');
      }

      console.log('\n=== TEST 2: POST /api/ai/chat (Patient Answer) ===');
      const res2 = await fetch('http://localhost:5099/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: data1.conversationId,
          healthcareMode: 'ayush',
          communicationMode: 'voice',
          language: 'en',
          message: 'I have severe burning in my stomach after eating spicy food for 10 days',
        }),
      });
      const data2 = await res2.json();
      console.log('Answer response:', data2);
      if (!data2.success || !data2.nextQuestion) {
        throw new Error('Answer follow-up failed');
      }

      console.log('\n=== TEST 3: POST /api/ai/chat (General Medical Mode) ===');
      const res3 = await fetch('http://localhost:5099/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          healthcareMode: 'general_medical',
          communicationMode: 'text',
          language: 'en',
          message: 'Persistent dry cough and mild fever since 3 days',
        }),
      });
      const data3 = await res3.json();
      console.log('General Medical response:', data3);
      if (!data3.success || !data3.nextQuestion) {
        throw new Error('General Medical chat failed');
      }

      console.log('\n>>> ALL AI CHAT ROUTE TESTS PASSED SUCCESSFULLY! <<<');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('Test Failed:', err);
      server.close();
      process.exit(1);
    }
  });
}

run();
