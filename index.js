const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');
const items = require('./routes/items.route');
const curator = require('art-curator');
const https = require('https');
const items_controller = require('./controllers/items.controller');
const USERS_TABLE = process.env.USERS_TABLE;
const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDb;
const PORT = process.env.PORT || 3000

if (IS_OFFLINE === 'true') {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  })
  console.log(dynamoDb);
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
};
app.use(bodyParser.json({ strict: false }));
app.use('/test', items)
//app.use('/items/wikidata/:lang/:category/:wdt/:wd', items)

app.get('/items/wikidata', function (req, res) {
  console.log(req.originalUrl)
  const lang = req.params.lang;
  const cat = req.params.category;
  const wdt = req.params.wdt;
  const wd = req.params.wd;
  console.log('lang',lang);
  console.log('cat',cat);
  console.log('wdt',);
  console.log('wd',wd);
  const wikiUrl = curator.createWikiDataCategoryUrl(lang, cat, wdt, wd);
    console.log('wikiUrl',wikiUrl);
    https.get(wikiUrl, (wikiRes) => {
        const statusCode = wikiRes.statusCode;
        let error;
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
        }
        if (error) {
            console.error(error.message);
            wikiRes.resume();
            return;
        }
        let rawData = '';
        wikiRes.on('data', (chunk) => { rawData += chunk; });
        wikiRes.on('end', async () => {
            let result = JSON.parse(rawData)['results']['bindings'];
            let finalResult = {
              "result": result
            }
            console.log('result',result);
            res.status(200).json(finalResult);
        });
    }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
        if (typeof e.status !== 'undefined') {
          res.status(e.status).send(e.message);
        }
    });
});

// Testing
app.get('/', function (req, res) {
  res.send('calasasaya')
});

// Get User endpoint
app.get('/users/:userId', function (req, res) {
  const params = {
    TableName: USERS_TABLE,
    Key: { userId: req.params.userId },
  };
  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get user' });
    }
    if (result.Item) {
      const {userId, name} = result.Item;
      res.json({ userId, name });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
})

// Create User endpoint
app.post('/users', function (req, res) {
  const { userId, name } = req.body;
  if (typeof userId !== 'string') {
    res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof name !== 'string') {
    res.status(400).json({ error: '"name" must be a string' });
  }
  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: userId,
      name: name,
    },
  };
  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create user' });
    }
    res.json({ userId, name });
  });
})

module.exports.handler = serverless(app);

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
console.log('router.stack',app._router.stack);
