# praise-cage-rest-api-workshop
Norfolk JS 2025 Workshop on REST APIs

## Getting Started

Use this repo to create a codespace, and you can use your GitHub account to register for a Val.town account. 

### Create a Static HTML Page with a `<form>` Element to POST

Create an `index.html` file and add the following code:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Val Town Form Example</title>
</head>
<body>
  <h1>Submit a Praise</h1>
  <form action="https://<VALTOWNUSER>-<VALTOWNFUNCTION>.web.val.run" method="POST"> <!-- update with your HTTP endpoint URL -->
    <label for="praise">Enter Praise:</label>
    <input type="text" name="praise" id="praise" required />
    <button type="submit">Submit</button>
  </form>
</body>
</html>
```
Serve your static HTML with `npx live-server` in the console. Hit 'Y' to accept downloading, if it asks, first time only. Make note of the proxy URL VSCode generates for you. 

### Create a Val Town HTTP Endpoint to Receive Form-Encoded Data and Respond with JSON

Create a new HTTP Val in Val Town and add the following code:

```js
let praises = []; // Stores praises (resets when the val restarts)

export default async function(req) {
  if (req.method === 'POST') {
    const formData = await req.formData();
    const praise = formData.get('praise');

    if (praise) {
      praises.push(praise);
    }

    // Return JSON response
    return Response.json({
      success: true,
      praises,
    });
  }

  if (req.method === 'GET') {
    return Response.json(praises);
  }

  return Response.json({ error: 'Method not allowed.' }, { status: 405 });
}
```

### View JSON Response in the Browser
- After submitting a form entry, the page will display JSON output with all recorded praises.
- Open the endpoint URL in a browser (`GET` request) to view stored praises in JSON format.

### No Client-Side JavaScript Required to Send Data
- The form submission works **without JavaScript**.
- The browser directly handles sending form data to the Val Town API.

### Update Val Town HTTP Endpoint to Return a Redirect to an HTML Page
Modify the Val Town function to redirect users back to the form page after submitting a praise:

```js
export default async function(req) {
  if (req.method === 'POST') {
    const formData = await req.formData();
    const praise = formData.get('praise');

    if (praise) {
      praises.push(praise);
    }

    // Redirect back to the form page
    return new Response(null, {
      status: 302,
      headers: { "Location": "https://your-static-page-url.com" } // Update with actual form page URL
    });
  }

  if (req.method === 'GET') {
    return Response.json(praises);
  }

  return Response.json({ error: 'Method not allowed.' }, { status: 405 });
}
```

### Use HTML Page to Issue a GET Request to the Val Town HTTP Endpoint

Modify the `index.html` file to include a button for fetching all stored praises:

```html
<form action="https://<VALTOWNUSER>-<VALTOWNFUNCTION>.web.val.run" method="GET">
  <button type="submit">View Praises</button>
</form>
```

### Update Val Town HTTP Endpoint to Return HTML Instead of JSON
Modify the Val Town function to return an HTML page instead of JSON:

```js
export default async function(req) {
  if (req.method === 'POST') {
    const formData = await req.formData();
    const praise = formData.get('praise');

    if (praise) {
      praises.push(praise);
    }

    return new Response(null, {
      status: 302,
      headers: { "Location": "https://your-static-page-url.com" } // Update with actual form page URL
    });
  }

  if (req.method === 'GET') {
    // Return HTML with praises
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Praises</title></head>
      <body>
        <h1>Praise List</h1>
        <ul>
          ${praises.map(p => `<li>${p}</li>`).join('')}
        </ul>
        <a href="/">Go back</a> // Update with actual form page URL
      </body>
      </html>
    `;
    return new Response(htmlContent, {
      headers: { "Content-Type": "text/html" }
    });
  }

  return Response.json({ error: 'Method not allowed.' }, { status: 405 });
}
```


Modify the Val Town function to return an HTML page instead of JSON:

```js
export default async function(req) {
  if (req.method === 'POST') {
    const formData = await req.formData();
    const praise = formData.get('praise');

    if (praise) {
      praises.push(praise);
    }

    return new Response(null, {
      status: 302,
      headers: { "Location": "https://your-static-page-url.com" }
    });
  }

  if (req.method === 'GET') {
    // Return HTML with praises
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Praises</title></head>
      <body>
        <h1>Praise List</h1>
        <ul>
          ${praises.map(p => `<li>${p}</li>`).join('')}
        </ul>
        <a href="/">Go back</a>
      </body>
      </html>
    `;
    return new Response(htmlContent, {
      headers: { "Content-Type": "text/html" }
    });
  }

  return Response.json({ error: 'Method not allowed.' }, { status: 405 });
}
```

### Serving Static Files Before Building the API

Before setting up a new API layer, we will serve static files from the local file system. This allows us to load `index.html` and any other static assets without relying on `npx live-server`.

#### Setting Up Static File Serving
Create a new file called `server.js` and add the following code:

```js
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
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
  
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end(JSON.stringify({ error: 'Method not allowed.' }))
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
```

#### Running the Static Server
1. Save the file as `server.js`.
2. Run the server with:
   ```sh
   node server.js
   ```
3. Open `http://localhost:3000` in a browser to see the static `index.html` page load.

Once this is working, we can proceed to add API functionality.

### Transitioning to a Local Development Server

Now that we have served static files, the next step is to create a local development server that mirrors the same functionality as the Val Town endpoint. This allows attendees to seamlessly switch between the Val Town API and their own local server while maintaining the same RESTful functionality.

We're going to use Node.js's built-in `http` module. This allows you to switch endpoints and see identical results, but now running in their own codespace.

#### Adding API Functionality

Now that our server can serve static files, let's extend it to handle API routes for submitting and retrieving praises.
Create a new file called `server.js` and add the following code:

```js
const { URLSearchParams } = require('url'); // add to parse URL parameters

let praises = []; // create temporary data structure in memory 

const server = http.createServer(async (req, res) => {

  // additional HTTP API routes 
  if (req.method === 'POST' && req.url === '/praises') { // notice new route that we define
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const formData = new URLSearchParams(body); // Parse form data
      const praise = formData.get('praise'); // Extract praise text
      
      if (praise) {
        praises.push(praise);
      }
      res.writeHead(302, { 'Location': '/' });
      res.end();
    });
    return;
  }
  
  if (req.method === 'GET' && req.url === '/praises?') { // notice new route that we define
    res.writeHead(200, { 'Content-Type': 'text/html' });
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

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Bruh, Method not allowed.' }));
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
```

#### Running the Local Server
1. Save the file as `server.js`.
2. Run the server with:
   ```sh
   node server.js
   ```
3. Open `http://localhost:3000` in a browser to see the form.
4. Submit a praise, then refresh to see it persist.
5. Open `http://localhost:3000/praises` in a browser to see the stored praises in JSON format.

#### Switching Endpoints
- Attendees can now switch between their Val Town endpoint and their local `http://localhost:3000/praises` to see the same results, demonstrating how RESTful APIs function consistently across environments.

