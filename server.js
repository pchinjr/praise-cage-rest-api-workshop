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

fastify.post('/praises/:id', async (req, reply) => {
  const { id } = req.params;
  const { updated_praise } = req.body;
  const index = parseInt(id, 10);

  if (!updated_praise) {
    return reply.status(400).type('text/html').send('<h1>Praise is required</h1><a href="/praises">Go Back</a>');
  }

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

fastify.post('/logout', async (req, reply) => {
  reply
    .clearCookie('token', { path: '/' })
    .redirect('/');
});

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) throw err;
  console.log(`Server running at ${address}`);
});