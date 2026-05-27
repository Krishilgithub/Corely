const https = require('https');
['googledrive', 'notion', 'gmail', 'slack', 'confluence'].forEach(slug => {
  https.get(`https://unpkg.com/simple-icons@10.0.0/icons/${slug}.svg`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(slug + ': ' + data));
  });
});
