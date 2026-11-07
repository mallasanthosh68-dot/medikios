const express = require('express');
const request = require('supertest');

// Test the mounted AI chat route
const app = express();
app.use(express.json());
const aiRoutes = require('../backend/src/routes/aiRoutes');
app.use('/api/ai', aiRoutes);

async function testChatEndpoint() {
  console.log('=== TEST: POST /api/ai/chat with AYUSH mode ===');
  
  // 1. Initial invocation without message (greeting)
  const initRes = await request(app)
    .post('/api/ai/chat')
    .send({
      healthcareMode: 'ayush',
      communicationMode: 'voice',
      language: 'en',
    });

  console.log('Init status:', initRes.status);
  console.log('Init response:', initRes.body);

  if (!initRes.body.success || !initRes.body.conversationId || !initRes.body.nextQuestion) {
    throw new Error('Initial chat greeting failed');
  }

  const convId = initRes.body.conversationId;

  // 2. Patient reply
  const replyRes = await request(app)
    .post('/api/ai/chat')
    .send({
      conversationId: convId,
      healthcareMode: 'ayush',
      communicationMode: 'voice',
      language: 'en',
      message: 'I have severe burning in my stomach after eating spicy food for 10 days',
    });

  console.log('\nReply status:', replyRes.status);
  console.log('Reply response:', replyRes.body);

  if (!replyRes.body.success || !replyRes.body.nextQuestion) {
    throw new Error('Chat message follow-up failed');
  }

  // 3. Test General Medical mode
  console.log('\n=== TEST: POST /api/ai/chat with General Medical mode ===');
  const gmRes = await request(app)
    .post('/api/ai/chat')
    .send({
      healthcareMode: 'general_medical',
      communicationMode: 'text',
      language: 'en',
      message: 'Persistent dry cough and mild fever since 3 days',
    });

  console.log('General Medical status:', gmRes.status);
  console.log('General Medical response:', gmRes.body);

  if (!gmRes.body.success || !gmRes.body.nextQuestion) {
    throw new Error('General Medical chat failed');
  }

  console.log('\n>>> POST /api/ai/chat END-TO-END VERIFICATION PASSED! <<<');
}

testChatEndpoint().catch((err) => {
  console.error('Chat Test Error:', err);
  process.exit(1);
});
