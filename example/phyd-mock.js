'use strict';

const express = require(`express`);
const request = require(`request`);
const bodyParser = require(`body-parser`);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.text({
  type: req => req.headers['content-type'].match(/text|xml$/)
}));

const port = 4000;

app.post(`/trip`, (req, res) => {
  console.log(`trip received:\n${req.body}`);
  res.end(`<msg>Ping received !</msg>`);

  setTimeout(() => {
    request.post({
      url: `http://127.0.0.1:${port + 1}/score`,
      body: `<msg>Score is 100</msg>`
    }, (err, resp, body) => {
      if (err) {
        return console.error(`failed to receive score response: ${err.message}`);
      }
      console.log(`score response received:\n${body}`);
    });
  }, 500);
});

const server = app.listen(port, () => console.log(`listening on ${server.address().port}`));
