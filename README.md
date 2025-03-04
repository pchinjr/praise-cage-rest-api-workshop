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
Serve your static HTML with `npx live-server` in the console. Hit 'Y' to accept downloading, if it asks, first time only. Make note of the proxy URL Codespaces generates for you. It is available as an environment variable `echo $CODESPACE_NAME`  

### Create a Val.town HTTP Endpoint to Receive Form-Encoded Data and Respond with JSON

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
- The browser has only two methods for <form> elements, GET and POST
- POST requests contain form-encoded data

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
      headers: { "Location": "https://your-codespace-proxy-url.com" } // Update with Codespaces proxy URL
    });
  }

  if (req.method === 'GET') {
    return Response.json(praises);
  }

  return Response.json({ error: 'Method not allowed.' }, { status: 405 });
}
```

### Use HTML Page to Issue a GET Request to the Val Town HTTP Endpoint

Modify the `index.html` file to include a button for fetching all stored praises as JSON:

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
We now have written server code that handles serving static files. How would we load CSS files? 

### Running the Static Server
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

### Adding API Functionality

Now that our server can serve static files, let's extend it to handle API routes for submitting and retrieving praises.
Add the following code to `server.js`:

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

fastify.get('/', async (req, reply) => {
  reply.type('text/html').send(`
    <!DOCTYPE html>
    <html>
    <head><title>Login</title></head>
    <body>
      <h1>Praise App</h1>
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

fastify.post('/login', async (req, reply) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) {
    return reply.status(401).type('text/html').send('<h1>Invalid username or password</h1><a href="/">Go Back</a>');
  }

  const token = fastify.jwt.sign({ username });

  reply
    .setCookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' })
    .redirect('/praises');
});

fastify.addHook('onRequest', async (req, reply) => {
  if (req.url.startsWith('/praises')) {
    try {
      const token = req.cookies.token;
      if (!token) throw new Error();
      req.user = fastify.jwt.verify(token);
    } catch (err) {
      reply
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

fastify.get('/praises', async (req, reply) => {
  reply.type('text/html').send(`
    <!DOCTYPE html>
    <html>
    <head><title>Praises</title></head>
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

fastify.post('/praises', async (req, reply) => {
  const { praise } = req.body;
  if (!praise) return reply.status(400).type('text/html').send('<h1>Praise is required</h1><a href="/praises">Go Back</a>');

  praises.push(praise);
  reply.redirect('/praises');
});

fastify.post('/logout', async (req, reply) => {
  reply
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
fastify.post('/praises/:id', async (req, reply) => {
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

  reply.redirect('/praises');
});


fastify.post('/praises/delete/:id', async (req, reply) => {
  const { id } = req.params;
  const index = parseInt(id, 10);

  if (!isNaN(index) && index >= 0 && index < praises.length) {
    praises.splice(index, 1);
  }

  reply.redirect('/praises');
});
```
Notice that our user data is only stored in local memory, so everytime the server resets, that data is gone. Also note that both users share the same data. How would you separate each user's data?