# calasasaya

This project is a [Serverless](https://serverless.com) deployment of a NodeJS and [AWS Lambda](https://console.aws.amazon.com/lambda/home) application.


#
## Table of cotents

* [Workflow](#workflow)
* [The List api](#the-List-api)
* [Adding a DynamoDB table with REST-like endpoints](#adding-a-DynamoDB-table-with-REST-like-endpoints)
* [Setting up the first endpoint](#setting-up-the-first-endpoint)
* [Setting up credentials](#setting-up-credentials)
* [Serverless tasks to do](#serverless-tasks-to-do)


#
## Workflow


### Deploy
```
serverless deploy (or sls deploy)
serverless invoke local
serverless invoke local --function=my-express-application-dev-app --log
export SLS_DEBUG=true // enable debugging
sls offline start
```

The console will then show endpoints in the Service Information section.

https://k7ixzm3zr0.execute-api.us-east-1.amazonaws.com/dev



#
## The List api

In the [Tiwanaku](https://github.com/timofeysie/tiwanaku) project we call this API:
```
backendListUrl = 'https://radiant-springs-38893.herokuapp.com/api/list';
```

The is handled in the [Conchifolia](https://github.com/timofeysie/conchifolia) app which is deployed on Heroku.

The goal here is to move that functionality here, and add a category parameter to get an arbitrary list from WikiData.  Right now the list is set to cognitive bias.  Today we will also try a list of fallacies.

We also want to layer the app as per the best practices recommendations.  For example, we have a setup like this for newer routes on that project:
```
const cognitive_bias = require('./routes/cognitive_bias.route');
...
.use('/cognitive_bias', cognitive_bias)
```

There are also the following files:
```
routes/cognitive_bias.route.js
controllers/cognitive_bias.controller.js
models/cognitive_bias.model.js
```

We also have a utilities directory with database specific stuff in it and a view directory that holds some pages and the Angular app that the Node app serves.

It's nice to think that we can just copy all those files across, change cognitive_bias to items and have everything work.  One problem with this is that the result from he WikiData call comes with the query attached to all the fields.  Another problem is that we were using MongoDB with Mongoose:
```
const Schema = mongoose.Schema;
let CognitiveBiasSchema = new Schema({
    cognitive_bias: {type: String, required: true, max: 300},
    cognitive_biasLabel: {type: String, required: false, max: 300},
    cognitive_biasDescription: {type: String, required: false, max: 300},
    lang: {type: String, required: false, max: 50}
});
```

So the big two challenges here then are use DynamoDB configured via the Serverless yaml file, and create a generic data model that can hold any query result for a particular list.  This could take a while.

I think we should deal with the generic data model first.  So get the API call working with the current data model, then store each whole object as an item and let the client use introspection to work with the data.


What do we need to add to our package.json?
```
const path = require('path')
const curator = require('art-curator');
const https = require('https');
```

I think that's it.  Actually we don't need path for this functionality.  So leave that out.

Now going to the new endpoint causes the following result:
https://k7ixzm3zr0.execute-api.us-east-1.amazonaws.com/users

```
{"message":"Forbidden"}
```

Using the c-url command returns the same result.  But getting the user works.  Why is one forbidden and the other not?  Do we need to add something to the yaml?

Looking at the API gatemway, it shows:
```
API endpoint: https://k7ixzm3zr0.execute-api.us-east-1.amazonaws.com/dev/Authorization: NONEMethod: ANY
```

So where does that dev string come from?  None of the user API endpoints have dev on them.  You can do this:
```
https://k7ixzm3zr0.execute-api.us-east-1.amazonaws.com/dev/users/calasasaya1
```

But you can't do this:
```
https://k7ixzm3zr0.execute-api.us-east-1.amazonaws.com/dev/items
```

It returns a 404.

Running the app locally also returns a 404.
```
http://localhost:3000/items
```

The console output looks like this:
```
Serverless: ANY /items (λ: app)
[offline] requestId: 5547555803458968
[offline] contentType: application/json
[offline] requestTemplate:
[offline] payload: null
[offline] Invalidating cache...
[offline] Loading handler... (/Users/tim/node/aws/calasasaya/index)
DocumentClient {
  options:
   { region: 'localhost',
     endpoint: 'http://localhost:8000',
     attrValue: 'S8' },
  service:
   Service {
     config:
      Config {
        credentials: [EnvironmentCredentials],
        credentialProvider: [CredentialProviderChain],
        region: 'localhost',
        logger: null,
        apiVersions: {},
        apiVersion: null,
        endpoint: 'http://localhost:8000',
        httpOptions: [Object],
        maxRetries: undefined,
        maxRedirects: 10,
        paramValidation: true,
        sslEnabled: true,
        s3ForcePathStyle: false,
        s3BucketEndpoint: false,
        s3DisableBodySigning: true,
        computeChecksums: true,
        convertResponseTypes: true,
        correctClockSkew: false,
        customUserAgent: null,
        dynamoDbCrc32: true,
        systemClockOffset: 0,
        signatureVersion: null,
        signatureCache: true,
        retryDelayOptions: {},
        useAccelerateEndpoint: false,
        clientSideMonitoring: false,
        endpointDiscoveryEnabled: false,
        endpointCacheSize: 1000,
        hostPrefixEnabled: true },
     endpoint:
      Endpoint {
        protocol: 'http:',
        host: 'localhost:8000',
        port: 8000,
        hostname: 'localhost',
        pathname: '/',
        path: '/',
        href: 'http://localhost:8000/' },
     _events: { apiCallAttempt: [Array], apiCall: [Array] },
     MONITOR_EVENTS_BUBBLE: [Function: EVENTS_BUBBLE],
     CALL_EVENTS_BUBBLE: [Function: CALL_EVENTS_BUBBLE],
     _clientId: 13 },
  attrValue: 'S8' }
[offline] event: { headers:
   { Host: 'localhost:3000',
     Connection: 'keep-alive',
     Pragma: 'no-cache',
     'Cache-Control': 'no-cache',
     'Upgrade-Insecure-Requests': '1',
     'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
     Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
     'Accept-Encoding': 'gzip, deflate, br',
     'Accept-Language': 'en,ko;q=0.9,en-US;q=0.8,en-AU;q=0.7' },
  multiValueHeaders:
   { Host: [ 'localhost:3000' ],
     Connection: [ 'keep-alive' ],
     Pragma: [ 'no-cache' ],
     'Cache-Control': [ 'no-cache' ],
     'Upgrade-Insecure-Requests': [ '1' ],
     'User-Agent':
      [ 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36' ],
     Accept:
      [ 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3' ],
     'Accept-Encoding': [ 'gzip, deflate, br' ],
     'Accept-Language': [ 'en,ko;q=0.9,en-US;q=0.8,en-AU;q=0.7' ] },
  path: '/items',
  pathParameters: { proxy: 'items' },
  requestContext:
   { accountId: 'offlineContext_accountId',
     resourceId: 'offlineContext_resourceId',
     apiId: 'offlineContext_apiId',
     stage: 'dev',
     requestId: 'offlineContext_requestId_7923443055534232',
     identity:
      { cognitoIdentityPoolId: 'offlineContext_cognitoIdentityPoolId',
        accountId: 'offlineContext_accountId',
        cognitoIdentityId: 'offlineContext_cognitoIdentityId',
        caller: 'offlineContext_caller',
        apiKey: 'offlineContext_apiKey',
        sourceIp: '127.0.0.1',
        cognitoAuthenticationType: 'offlineContext_cognitoAuthenticationType',
        cognitoAuthenticationProvider: 'offlineContext_cognitoAuthenticationProvider',
        userArn: 'offlineContext_userArn',
        userAgent:
         'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
        user: 'offlineContext_user' },
     authorizer:
      { principalId: 'offlineContext_authorizer_principalId',
        claims: undefined },
     protocol: 'HTTP/1.1',
     resourcePath: '/{proxy*}',
     httpMethod: 'GET' },
  resource: '/{proxy*}',
  httpMethod: 'GET',
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  body: null,
  isOffline: true }
[offline] _____ CALLING HANDLER _____
[offline] _____ HANDLER RESOLVED _____
[offline] Using response 'default'
[offline] _____ RESPONSE PARAMETERS PROCCESSING _____
[offline] Found 0 responseParameters for 'default' response
[offline] headers { 'x-powered-by': [ 'Express' ],
  'content-security-policy': [ 'default-src \'none\'' ],
  'x-content-type-options': [ 'nosniff' ],
  'content-type': [ 'text/html; charset=utf-8' ],
  'content-length': [ '144' ] }
[offline] requestId: 5547555803458968
```

Just going to http://localhost:3000/ works as expected.  So what's wrong?

Ahh, because our endpoint is actually http://localhost:3000/items/get_wikidata!

Then we can see our error:
{"errorMessage":"Error while loading app","errorType":"SyntaxError","stackTrace":["/Users/tim/node/aws/calasasaya/controllers/items.controller.js:46","}","^","","SyntaxError: missing ) after argument list","at new

Fix that and we get our list.  There is always this error:
```
2019-06-03 20:12:41.615:WARN:oejuc.AbstractLifeCycle:FAILED SelectChannelConnector@0.0.0.0:8000: java.net.BindException: Address already in use
```

But that's a minor thing.  Next it's time to pass the subject via the API call.

#
## Adding a DynamoDB table with REST-like endpoints

We will be adding a user to a database table.  In the yaml file we provision a user table in the resources section using CloudFormation syntax, add IAM permissions for the functions under the iamRoleStatements portion of the provider block and pass the table name as the environment variable USERS_TABLE in the environment portion of the provider block.

Then implement two endpoints: POST /user to create a new user, and GET /user/{userId} to get information on a particular user.

Install the normal stuff:
```
$ npm install --save aws-sdk body-parser
```

export BASE_DOMAIN=https://k7ixzm3zr0.execute-api.us-east-1.amazonaws.com/dev

Test the endpoints using curl.
create a user:
```
$ curl -H "Content-Type: application/json" -X POST ${BASE_DOMAIN}/users -d '{"userId": "calasasaya1", "name": "Test User"}'
{"userId":"calasasaya1","name":"Test User"}
```

Get the user back:
```
$ curl -H "Content-Type: application/json" -X GET ${BASE_DOMAIN}/users/calasasaya1
{"userId":"calasasaya1","name":"Test User"}
```

These didn't work as there was a DynamoDB error.  Followed [this](https://github.com/99xt/serverless-dynamodb-local/issues/210) to get it working, but the app still does not work.

The output when run locally is:
```
Serverless: Invoke offline:start
Dynamodb Local Started, Visit: http://localhost:8000/shell
NetworkingError: connect ECONNREFUSED 127.0.0.1:8000: DynamoDB - Error -
  Networking Error ---------------------------------------
  connect ECONNREFUSED 127.0.0.1:8000
     For debugging logs, run again after setting the "SLS_DEBUG=*" environment variable.
  Stack Trace --------------------------------------------
NetworkingError: connect ECONNREFUSED 127.0.0.1:8000
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1117:14)
From previous event:
    at PluginManager.invoke (/Users/tim/.nvm/versions/node/v10.14.2/lib/node_modules/serverless/lib/classes/PluginManager.js:422:22)
```

Running the app locally using the following:
```
$ serverless invoke local --function=my-express-application-dev-app --log
...
Function "my-express-application-dev-app" doesn't exist in this Service
...
$ serverless invoke local
...
This command requires the --function option / -f shortcut. Usage: Name of the function
$ serverless deploy list functions
Serverless: Listing functions and their last 5 versions:
Serverless: -------------
Serverless: app: 7, 8, 9, 10, 11
QuinquenniumF:calasasaya tim$ serverless logs -f app
```

So then this should work:
```
serverless invoke local --function=app --log
sls offline start
```




#
## Setting up the first endpoint

After initial setup and deployment, going to this address however shows the following:
```
{"message": "Internal server error"}
```

The full deploy log:
```
$ serverless deploy
Serverless: Packaging service...
Serverless: Excluding development dependencies...
Serverless: Uploading CloudFormation file to S3...
Serverless: Uploading artifacts...
Serverless: Uploading service calasasaya.zip file to S3 (714.55 KB)...
Serverless: Validating template...
Serverless: Updating Stack...
Serverless: Checking Stack update progress...
..................................
Serverless: Stack update finished...
Service Information
service: calasasaya
stage: dev
region: us-east-1
stack: calasasaya-dev
resources: 11
api keys:
  None
endpoints:
  ANY - https://k7ixzm3zr0.execute-api.us-east-1.amazonaws.com/dev
  ANY - https://k7ixzm3zr0.execute-api.us-east-1.amazonaws.com/dev/{proxy+}
functions:
  app: calasasaya-dev-app
layers:
  None
```

## Setting up credentials

https://serverless.com/framework/docs/providers/aws/guide/credentials/

Quick Setup
```
export AWS_ACCESS_KEY_ID=<your-key-here>
export AWS_SECRET_ACCESS_KEY=<your-secret-key-here>
AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are now available for serverless to use
serverless deploy
```

Using AWS Profiles with the serverless config credentials command fails:
```      
Serverless: Setting up AWS...
Serverless: Failed! ~/.aws/credentials already has a "default" profile. Use the overwrite flag ("-o" or "--overwrite") to force the update
```

Based on [this](https://serverless.com/blog/serverless-express-rest-api/) article.

## Serverless tasks to do

Possible improvements could be some of the following.

* Create a Kinesis Stream and configure it to capture data from a website.
* Logic Workflows using AWS Lambda and Step Functions
