const { Client } = require('ssh2')

const config = {
  host: '127.0.0.1',
  port: 50394,
  username: 'foo',
  password: 'bar'
}

const remotePath = '/tmp'

const conn = new Client()

conn.on('error', (err) => console.log(''/*err*/))

conn.on('ready', () => {
  console.log('ready')
  conn.sftp((err, sftp) => {
    console.log('sftp')
    if (err) throw err;
    sftp.readdir(remotePath, (err, list) => {
       console.log('readdir callback')
       if (err) throw err
       console.log('success')
    })
  })
}).connect(config)

// keep event loop busy for some time...
setTimeout(()=>console.log('tick'),10000)
