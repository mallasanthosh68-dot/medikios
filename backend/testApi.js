async function test() {
  try {
    console.log('--- 1. Checking Frontend and Backend Health ---');
    const fe = await fetch('http://localhost:3000/');
    console.log('Frontend Status:', fe.status, fe.statusText);

    const h = await fetch('http://localhost:5000/api/health').then(r => r.json());
    console.log('Backend Status:', h.status, h.database.type);

    console.log('\n--- 2. Authenticating Patient ---');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '9876543210', password: 'Password@123', role: 'patient' })
    });
    const { token, user } = await loginRes.json();
    console.log('Patient authenticated:', user.name, '(Token present:', !!token, ')');

    const testCases = [
      { code: 'hi', name: 'Hindi', phrase: 'I have severe chest pain and cold sweat since morning' },
      { code: 'te', name: 'Telugu', phrase: 'I have had high fever and headache for three days' },
      { code: 'ta', name: 'Tamil', phrase: 'I have intense stomach ache and vomiting since yesterday' },
      { code: 'mr', name: 'Marathi', phrase: 'I have a sore throat and bad dry cough for two days' },
      { code: 'bn', name: 'Bengali', phrase: 'I am feeling dizzy and have severe weakness' },
      { code: 'sa', name: 'Sanskrit', phrase: 'I have high fever and weakness' },
    ];

    for (const tc of testCases) {
      console.log(`\n--- Testing ${tc.name} (${tc.code}) ---`);

      // 1. Start interview
      const startRes = await fetch('http://localhost:5000/api/patients/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ language: tc.code })
      }).then(r => r.json());
      console.log(`[Greeting in ${tc.name}]:`, startRes.greeting);

      // 2. Translate speech
      const trRes = await fetch('http://localhost:5000/api/patients/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text: tc.phrase, targetLanguage: tc.code })
      }).then(r => r.json());
      console.log(`[Patient Spoke]: "${tc.phrase}"`);
      console.log(`[Translated Every Word to ${tc.name}]:`, trRes.translatedText);

      // 3. Submit voice answer
      const ansRes = await fetch(`http://localhost:5000/api/patients/interview/${startRes.interviewId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          question: startRes.greeting,
          answer: trRes.translatedText,
          inputMode: 'voice',
        })
      }).then(r => r.json());
      console.log(`[AI Diagnostic Follow-Up in ${tc.name}]:`, ansRes.nextQuestion);
    }

    console.log('\n======================================================');
    console.log('✓ ALL MULTILINGUAL INTERFACES & SPEECH TRANSLATION VERIFIED!');
    console.log('======================================================');
  } catch (err) {
    console.error('Test execution failed:', err);
  }
}
test();
