const http = require('http');
const fs = require('fs');
const path = require('path');
const index = path.resolve(process.cwd(), 'index.html');
const conType = s => ({
  '.html': 'text/html',
  '.css': 'text/css',
  '.xml': 'text/xml',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/x-javascript',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.bmp': 'image/x-ms-bmp' }[path.extname(s)] || 'application/octet-stream');

const port = process.env.PORT ?? 5000;

http.createServer(async (i, o, n) => {
  o.on('finish', () => {
    let ip = i.headers['x-forwarded-for'] || i.connection.remoteAddress;
    console.log(`${ip} ${i.method} ${i.url} => ${o.statusCode}`);
  });

  const target = (i.url || '').replace(/^\//, '').replace(/[?#].*/, '');
  const file = path.resolve(process.cwd(), target);
  const fExists = await fs.promises.access(file)
    .then(() => fs.promises.stat(file).then(s => !s.isDirectory()))
    .catch(() => false);

  if (fExists && fs.statSync(file).isFile()) {
    o.setHeader('Content-Type', conType(file));
    o.writeHead(200);
    fs.createReadStream(file).pipe(o);
  } else {
    if ((target === '/' || target === '')) {
      o.setHeader('Content-Type', 'text/html');
      o.writeHead(200);

      return fs.createReadStream(index).pipe(o);
    }

    const fileWithHtml = path.resolve(process.cwd(), target + '.html');
    const htmlFileExists = await fs.promises.access(fileWithHtml)
      .then(() => fs.promises.stat(fileWithHtml).then(s => !s.isDirectory()))
      .catch(() => false);

    if (htmlFileExists) {
      o.setHeader('Content-Type', 'text/html');
      o.writeHead(200);
      return fs.createReadStream(fileWithHtml).pipe(o);
    }

    o.writeHead(404);
    o.end();
  }
}).listen(port, () => console.log(`up on ${port}`));
