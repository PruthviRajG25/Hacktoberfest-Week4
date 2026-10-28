const sample = `October 31, 1924. Blackwood Manor, Hollow Creek.
To whoever inherits this house after Clara Vance is gone:

Take this tarnished brass key labeled Room 17 in the east attic. Do not turn the latch until midnight has struck. My brother Arthur Vance locked himself inside on All Hallows' Eve forty years ago, swearing he heard a church organ playing beneath the floorboards. He never opened the door again, yet every October thirty-first at dusk, a fresh orange marigold appears on the threshold outside the keyhole, damp with river silt. 

The village undertaker, Thomas Finch, swore he buried Arthur with his marigold brooch in the churchyard beside Reverend Caleb Stone. Keep the marigold dry. If the key turns from the inside, do not run.`;

console.log('Sending sample memory to local Gemma 4 inference...');
const start = Date.now();

try {
  const res = await fetch('http://localhost:5001/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memory: sample })
  });

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`Inference finished in ${duration}s with HTTP ${res.status}`);

  const data = await res.json();
  console.log('Response payload:');
  console.log(JSON.stringify(data, null, 2));
} catch (e) {
  console.error('Inference error:', e);
}
