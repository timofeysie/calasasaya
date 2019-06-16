const curator = require('art-curator');
const https = require('https');

exports.test = function (req, res) {
    res.send('Acknowledge the test controller');
};

exports.get_wikidata = function (req, res) {
  const lang = req.query.lang;
  const cat = req.query.category;
  const wdt = req.query.wdt;
  const wd = req.query.wd;
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
            context.succeed(result);
        });
    }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
        if (typeof e.status !== 'undefined') {
          res.status(e.status).send(e.message);
        }
    });
}
