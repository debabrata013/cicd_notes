const assert = require('assert');
const http = require('http');
const app = require('../server');

console.log('🧪 Running automated tests for Starlight Notes...');

function makeRequest(port, pathUrl) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}${pathUrl}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', (err) => reject(err));
  });
}

async function runTests() {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    try {
      // Test 1: Health check endpoint
      const healthRes = await makeRequest(port, '/api/health');
      assert.strictEqual(healthRes.statusCode, 200, 'Health endpoint should return 200');
      const healthJson = JSON.parse(healthRes.body);
      assert.strictEqual(healthJson.status, 'ok', 'Health status should be ok');
      console.log('✅ PASS: /api/health returned 200 OK with status: ok');

      // Test 2: Index route HTML rendering
      const indexRes = await makeRequest(port, '/');
      assert.strictEqual(indexRes.statusCode, 200, 'Index route should return 200');
      assert.ok(indexRes.body.includes('Starlight Notes'), 'HTML should contain app title');
      assert.ok(indexRes.body.includes('LocalStorage'), 'HTML should mention LocalStorage');
      assert.ok(indexRes.body.includes('app.js'), 'HTML should load client app.js script');
      console.log('✅ PASS: GET / renders HTML with EJS successfully');

      // Test 3: CSS static asset route
      const cssRes = await makeRequest(port, '/css/style.css');
      assert.strictEqual(cssRes.statusCode, 200, 'CSS asset should return 200');
      assert.ok(cssRes.body.includes('--bg-primary'), 'CSS should contain CSS variables');
      console.log('✅ PASS: GET /css/style.css serves style sheet successfully');

      // Test 4: JS static asset route
      const jsRes = await makeRequest(port, '/js/app.js');
      assert.strictEqual(jsRes.statusCode, 200, 'JS asset should return 200');
      assert.ok(jsRes.body.includes('starlight_notes_data_v1'), 'JS should contain LocalStorage storage key');
      console.log('✅ PASS: GET /js/app.js serves client JS successfully');

      console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ TEST FAILED:', err);
      server.close(() => process.exit(1));
    }
  });
}

runTests();
