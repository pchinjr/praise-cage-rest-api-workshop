# praise-cage-rest-api-workshop
Norfolk JS 2025 Workshop on REST APIs

## **Getting Started with HTML and an HTTP Endpoint**  

To begin, **create a Codespace** from this repo and **set up a Val.town account** to handle form submissions.

### Create a Codespace
1. Fork this repository.  
2. In your forked repo, go to **Code → Codespaces** and create a new Codespace.  
3. This gives you an online dev environment to edit and run the project.

### Set Up a Val.town Account
1. Go to [Val.town](https://val.town) and sign in with your **GitHub account**.  
2. Create a new **HTTP val** to handle form submissions.  
3. Copy your Val.town function’s **endpoint URL**—you’ll use this in your `index.html` form.

Once set up, you’ll use **Val.town as your backend** and **Codespaces as your workspace**. 🚀

### Create a Static HTML Page with a `<form>` Element to POST

Create an `/public/index.html` file and add the following code:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Praise Cage REST API Workshop</title>
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
Serve your static HTML with `npx live-server` in the console. Hit 'Y' to accept downloading, if it asks, first time only. Make note of the proxy URL Codespaces generates for you. It is available as an environment variable `echo $CODESPACE_NAME`  

### Create a Val.town HTTP Endpoint to Receive Form-Encoded Data and Respond with JSON

Create a new HTTP Val in Val Town and add the following code:

```js
import { blob } from "https://esm.town/v/std/blob";

export default async function(request: Request) {
  const BLOB_KEY = "stored-praises";

  // Retrieve stored praises or initialize to empty array
  const stored = (await blob.getJSON(BLOB_KEY)) ?? [];
  // Ensures Blob JSON is an array
  const praises = Array.isArray(stored) ? stored : [];

  if (request.method === "GET") {
    return Response.json(praises);
  }

  if (request.method === "POST") {
    const formData = await request.formData();
    const praise = formData.get("praise");

    if (typeof praise === "string" && praise.trim() !== "") {
      praises.push(praise);
      await blob.setJSON(BLOB_KEY, praises);
    }

     // Return JSON response
    return Response.json({
      success: true,
      praises,
    });
  }

  return Response.json({ error: "Method not allowed." }, { status: 405 });
}
```

### View JSON Response in the Browser
- After submitting a form entry, the page will display JSON output with all recorded praises.
- Open the endpoint URL in a browser (`GET` request) to view stored praises in JSON format.

### No Client-Side JavaScript Required to Send Data
- The form submission works **without JavaScript**.
- The browser directly handles sending form data to the Val Town API.
- The browser has only two methods for <form> elements, GET and POST
- POST requests contain form-encoded data

### Update Val Town HTTP Endpoint to Return a Redirect to an HTML Page
Modify the Val Town function to redirect users back to the form page after submitting a praise:

```js
import { blob } from "https://esm.town/v/std/blob";

export default async function(request: Request) {
  const BLOB_KEY = "stored-praises";

  // Retrieve stored praises or initialize to empty array
  const stored = (await blob.getJSON(BLOB_KEY)) ?? [];
  const praises = Array.isArray(stored) ? stored : [];

  if (request.method === "GET") {
    return Response.json(praises);
  }

  if (request.method === "POST") {
    const formData = await request.formData();
    const praise = formData.get("praise");

    if (typeof praise === "string" && praise.trim() !== "") {
      praises.push(praise);
      await blob.setJSON(BLOB_KEY, praises);
    }

    // Redirect user to form page
    return new Response(null, {
      status: 302,
      headers: {
        Location: "https://<YOUR_GITHUB_PROXY_URL>.app.github.dev/public/",
      },
    });
  }

  return Response.json({ error: "Method not allowed." }, { status: 405 });
}
```

### Use HTML Page to Issue a GET Request to the Val Town HTTP Endpoint

Add a new button to `index.html` for issuing a GET request for all stored praises as JSON:

```html
<form action="https://<VALTOWNUSER>-<VALTOWNFUNCTION>.web.val.run" method="GET">
  <button type="submit">View Praises</button>
</form>
```

### Update Val Town HTTP Endpoint to Return HTML Instead of JSON
Modify the Val Town function to return an HTML page instead of JSON:

```js
import { blob } from "https://esm.town/v/std/blob";

export default async function(request: Request) {
  const BLOB_KEY = "stored-praises";

  // Retrieve stored praises or initialize to empty array
  const stored = (await blob.getJSON(BLOB_KEY)) ?? [];
  const praises = Array.isArray(stored) ? stored : [];

  if (req.method === 'GET') {
    // Return HTML with praises
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Server Rendered Praises</title></head>
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

  if (request.method === "POST") {
    const formData = await request.formData();
    const praise = formData.get("praise");

    if (typeof praise === "string" && praise.trim() !== "") {
      praises.push(praise);
      await blob.setJSON(BLOB_KEY, praises);
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: "https://<YOUR_GITHUB_PROXY_URL>.app.github.dev/public/",
      },
    });
  }

  return Response.json({ error: "Method not allowed." }, { status: 405 });
}
```
Congratulations, you know have a server rendered page!

## Build Our Own Server

Before setting up a new API layer, we will serve static files from the local file system. This allows us to load `index.html` and any other static assets without using `npx live-server`. Instead, we'll make a new server using Node's HTTP module. 

### Setting Up Static File Serving
Create a new file called `server.js` and add the following code:

```js
const http = require('http');
const fs = require('fs');
const path = require('path');

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
  
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end(JSON.stringify({ error: 'Method not allowed.' }))
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
```
We now have written server code that handles serving static files.

### Running the Static Server
1. Save the file as `server.js`.
2. Run the server with:
   ```sh
   node server.js
   ```
3. Open `http://localhost:3000` in a browser to see the static `index.html` page load.

Once this is working, we can proceed to add API functionality.

### Transitioning to a Local Development Server

Now that we have served static files, the next step is to mirror the functionality of the Val Town endpoint. This allows you to seamlessly switch between the Val Town API and your own server while maintaining the same RESTful functionality.

### Adding API Functionality

After serving static files, let's extend the server to handle API routes for submitting and retrieving praises.
Add the following code to `server.js`:

```js
const { URLSearchParams } = require('url'); // add to parse URL parameters

let praises = []; // create temporary data structure in memory 

const server = http.createServer(async (req, res) => {

  // additional HTTP API routes 
  if (req.method === 'POST' && req.url === '/praises') { // notice new route that we define
    let body = '';
    // Assemble form data from the client
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const formData = new URLSearchParams(body); // Parse form data
      const praise = formData.get('praise'); // Extract praise text
      
      if (praise) {
        praises.push(praise);
      }
      res.writeHead(302, { 'Location': '/' }); // redirect to index.html
      res.end();
    });
    return;
  }
  
  if (req.method === 'GET' && req.url === '/praises?') { // notice new route that we define
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

  // below is the same as previous step
  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Bruh, Method not allowed.' }));
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
```
#### Switching Endpoints
- You can now switch between the Val Town endpoint and your local endpoint `http://localhost:3000/praises` to see the same results, demonstrating how RESTful APIs function consistently across environments. Update `index.html` to use the new route on our local node server.

```html
<h1>Submit a Praise</h1>
  <form action="/praises" method="POST"> <!-- update with your HTTP endpoint URL -->
    <label for="praise">Enter Praise:</label>
    <input type="text" name="praise" id="praise" required />
    <button type="submit">Submit</button>
  </form>
  <form action="/praises" method="GET">
    <button type="submit">View Praises</button>
  </form>
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

## Add Authentication Hooks with Different Architecture
We will now add an authenication layer to our API using JWTs. To handle the new complexity, we can move to a framework that implements some request/response lifecycle hooks. This means the framework will give us an interface to do some processing during the request and response negotiations. The framework we'll use is Fastify. Also, we'll move to fully server rendered content for all pages. This lets the server compile the dynamic data and respond with a string of HTML that the browser will render.
```bash
npm init -y
npm install fastify @fastify/cookie @fastify/formbody @fastify/jwt
```
Replace your `server.js` code with the following: 
```js
const Fastify = require('fastify');
const fastifyCookie = require('@fastify/cookie');
const fastifyFormBody = require('@fastify/formbody');
const fastifyJwt = require('@fastify/jwt');

const fastify = Fastify({ logger: true });

fastify.register(fastifyCookie, { secret: 'cookie-secret' });
fastify.register(fastifyFormBody);
fastify.register(fastifyJwt, { secret: 'supersecretkey' });

const users = {
  nic: { password: 'praisecage!' },
  travolta: { password: 'thedevil666' }
};

let praises = [];

fastify.get('/', async (req, res) => {
  res.type('text/html').send(`
    <!DOCTYPE html>
    <html>
    <head><title>Login</title></head>
    <body>
      <h1>Praise Cage REST API Workshop</h1>
      <h2>Login</h2>
      <form action="/login" method="POST">
        <input type="text" name="username" placeholder="Username" required>
        <input type="password" name="password" placeholder="Password" required>
        <button type="submit">Login</button>
      </form>
    </body>
    </html>
  `);
});

fastify.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) {
    return res.status(401).type('text/html').send('<h1>Invalid username or password</h1><a href="/">Go Back</a>');
  }

  const token = fastify.jwt.sign({ username });

  res
    .setCookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' })
    .redirect('/praises');
});

fastify.addHook('onRequest', async (req, res) => {
  if (req.url.startsWith('/praises')) {
    try {
      const token = req.cookies.token;
      if (!token) throw new Error();
      req.user = fastify.jwt.verify(token);
    } catch (err) {
      res
        .type('text/html')
        .status(401)
        .send(`
          <!DOCTYPE html>
          <html>
          <head><title>Unauthorized</title></head>
          <body>
            <h1>Unauthorized</h1>
            <p>You must be logged in to access this page.</p>
            <a href="/">Login</a>
          </body>
          </html>
        `);
    }
  }
});

fastify.get('/praises', async (req, res) => {
  reply.type('text/html').send(`
    <!DOCTYPE html>
    <html>
    <head><title>Fastify Backed Praises</title></head>
    <body>
      <h1>Submit a Praise</h1>
      <form action="/praises" method="POST">
        <input type="text" name="praise" placeholder="Enter Praise" required>
        <button type="submit">Submit</button>
      </form>

      <h2>All Praises</h2>
      <ul>
        ${praises
          .map(
            (p, index) => `
            <li>
              <form action="/praises/${index}" method="POST">
                <input type="text" name="updated_praise" value="${p}" required>
                <button type="submit">Update</button>
              </form>

              <form action="/praises/delete/${index}" method="POST">
                <button type="submit">Delete</button>
              </form>
            </li>
          `
          )
          .join('')}
      </ul>

      <form action="/logout" method="POST">
        <button type="submit">Logout</button>
      </form>
    </body>
    </html>
  `);
});

fastify.post('/praises', async (req, res) => {
  const { praise } = req.body;
  if (!praise) return reply.status(400).type('text/html').send('<h1>Praise is required</h1><a href="/praises">Go Back</a>');

  praises.push(praise);
  res.redirect('/praises');
});

fastify.post('/logout', async (req, res) => {
  res
    .clearCookie('token', { path: '/' })
    .redirect('/');
});

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) throw err;
  console.log(`Server running at ${address}`);
});
```
You can start the server with `node server.js` from your command line. 

Notice that the JWT has no expiration, can it be intercepted and reused? How would you rotate or refresh tokens?

### Allowing updates and deletion in our API
These two new routes in `server.js` will allow for the client to send special POST requests to update or delete existing data. 
```js
fastify.post('/praises/:id', async (req, res) => {
  const { id } = req.params;
  const { updated_praise } = req.body;
  const index = parseInt(id, 10);

  if (!updated_praise) {
    return reply.status(400).send('<h1>Praise is required</h1><a href="/praises">Go Back</a>');
  }
  // ensure `index` is a valid number and within array bounds
  if (!isNaN(index) && index >= 0 && index < praises.length) {
    praises[index] = updated_praise;
  }

  res.redirect('/praises');
});


fastify.post('/praises/delete/:id', async (req, res) => {
  const { id } = req.params;
  const index = parseInt(id, 10);

  if (!isNaN(index) && index >= 0 && index < praises.length) {
    praises.splice(index, 1);
  }

  res.redirect('/praises');
});
```
Notice that our user data is only stored in local memory, so everytime the server resets, that data is gone. Also note that both users share the same data. How would you separate each user's data?

## Stuff we did
- Serve static HTML
- HTML `<forms>` element
- HTTP methods
  - `GET`
  - `POST`
- External API Endpoints
  - webhooks
  - returning JSON
  - returning HTML
- Server side rendering
- Build a stand alone server
- Stateless auth sessions with JWT
- Server side routing
- RESTful API Design
  - CRUD functionality

## Stuff you could add
- Client side JavaScript
  - `fetch()` API
  - URL Parameters
    - Query Strings
    - Path Parameters
- User Management
  - roles 
  - permissions
  - OAuth
- Persistent Data
  - databases
  - flat file lookups
- "Real Time" Updates
  - WebSockets
  - Server Sent Events
- SPA vs MPA
  - client vs server responsibilities
- Alternatives to REST
  - GraphQL
  - tRPC
- Deployment and Operation Models
  - monolith
  - microservice
  - CI/CD 