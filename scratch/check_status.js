async function check() {
  const b = await fetch('http://localhost:5000/api/health').then(r => r.json());
  const f = await fetch('http://localhost:3000').then(r => r.status);
  console.log('STATUS:', JSON.stringify({ backend: b.status, frontend: f }));
}
check().catch(console.error);
