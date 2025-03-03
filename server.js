const http = require('http');
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');

let praises = [];

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    fs.readFile(path.join(__dirname, '/public/index.html'), (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/praises') { // notice new route that we define
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString(); // Accumulate form-encoded data
    });
    req.on('end', () => {
      const formData = new URLSearchParams(body); // Parse form data
      const praise = formData.get('praise'); // Extract praise text

      if (praise) {
        praises.push(praise); // Store praise
      }

      // Redirect back to the form page
      res.writeHead(302, { 'Location': '/' });
      res.end();
      console.log(praises)
    });
    return;
  }

  // Serve stored praises as an HTML page (GET /praises)
  if (req.method === 'GET' && req.url === '/praises?') {
    console.log("GET TRIGGERED")
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Praise List</title></head>
      <body>
        <h1>All Praises</h1>
        <ul>
          ${praises.length > 0 
            ? praises.map(p => `<li>${p}</li>`).join('')
            : '<li>No praises yet.</li>'
          }
        </ul>
        <a href="/">Go Back</a>
      </body>
      </html>
    `;

    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': Buffer.byteLength(htmlContent),
      'Connection': 'close' // Ensures connection is properly closed
    });
    res.end(htmlContent);
    return;
  }

});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});