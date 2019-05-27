# calasasaya

This project is a [Serverless](https://serverless.com) deployment of a NodeJS and [AWS Lambda](https://console.aws.amazon.com/lambda/home) application.


#
## Workflow


### Deploy
```
serverless deploy (or sls deploy)
serverless invoke local
serverless invoke local --function=createUser --log
export SLS_DEBUG=true // enable debugging
```

The console will then show endpoints in the Service Information section.

https://k7ixzm3zr0.execute-api.us-east-1.amazonaws.com/dev


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
$ curl -H "Content-Type: application/json" -X POST ${BASE_DOMAIN}/users -d '{"userId": "calasasaya1", "name": "Alex DeBrie"}'
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

## Serverless tasks to do

* Create a Kinesis Stream and configure it to capture data from a website.
* Logic Workflows using AWS Lambda and Step Functions


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
