'use strict';

const { timingSafeEqual } = require('crypto');
const { constants, readFileSync } = require('fs');

const ssh2 = require('ssh2');

const allowedUser = Buffer.from('foo');
const allowedPassword = Buffer.from('bar');

const STATUS_CODE = ssh2.utils.sftp.STATUS_CODE
const OPEN_MODE = ssh2.utils.sftp.OPEN_MODE

function checkValue(input, allowed) {
  const autoReject = (input.length !== allowed.length);
  if (autoReject) {
    // Prevent leaking length information by always making a comparison with the
    // same input when lengths don't match what we expect ...
    allowed = input;
  }
  const isMatch = timingSafeEqual(input, allowed);
  return (!autoReject && isMatch);
}

new ssh2.Server({
  hostKeys: [readFileSync('host.key')]
}, (client) => {
  console.log('Client connected!');

  client.on('authentication', (ctx) => {
    let allowed = true;
    if (!checkValue(Buffer.from(ctx.username), allowedUser))
      allowed = false;

    switch (ctx.method) {
      case 'password':
        if (!checkValue(Buffer.from(ctx.password), allowedPassword))
          return ctx.reject();
        break;
      default:
        return ctx.reject();
    }

    if (allowed)
      ctx.accept();
    else
      ctx.reject();
  }).on('ready', () => {
    console.log('Client authenticated!');
    client.on('session', (accept, reject) => {
      const session = accept();
      session.on('sftp', (accept, reject) => {
        console.log('Client SFTP session');
        const sftp = accept();
        sftp.on('OPENDIR', (reqid, aPath) => {
          console.log('Opening directory', aPath);
          const handle = Buffer.alloc(4);
          handle.writeUInt32BE(0xaabbccdd, 0, true);
          sftp.handle(reqid, handle);
        }).on('READDIR', (reqid, handle, offset, length) => {
          console.log('Reading directory')

          console.log('OOPS'); process.exit(0)
        }).on('CLOSE', (reqid, handle) => {
        })
      });
    });
  }).on('close', () => {
    console.log('Client disconnected');
  });
}).listen(50394, '127.0.0.1', function() {
  console.log(`Listening on port ${this.address().port}`);
});
