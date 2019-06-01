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
