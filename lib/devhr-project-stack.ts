import * as cdk from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import {Duration} from '@aws-cdk/core';
import iam = require('@aws-cdk/aws-iam');
import event_sources = require('@aws-cdk/aws-lambda-event-sources');
import {partition} from "aws-cdk/lib/util";

const imageBucketName = "cdk-rekn-imagebucket"

export class DevhrProjectStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // s3.Bucket is the constructor, passing in 'this' as the scope
    const imageBucket = new s3.Bucket(this, imageBucketName)
    new cdk.CfnOutput(this, 'imageBucket', {value: imageBucket.bucketName});

    // dynamoDB - stores the image labels
    const table = new dynamodb.Table(this, 'ImageLabels', {
      // partitionKey is a property off the table with name 'image'
      // Creating a no-sql, key-value store, providing a value to search for
      partitionKey: {name: 'image', type: dynamodb.AttributeType.STRING}
    });
    new cdk.CfnOutput(this, 'ddbTable', {value: table.tableName});

    // lambda - allowing to run our function serverless
    // logical id of lambda is "rekognitionFunction"
    const rekFn = new lambda.Function(this, 'rekognitionFunction', {
      // providing a directory that CDK can use to create/deploy an artifact
      // cdk creates a zip file and pushed to staging bucket in the account
      // this bucket is created after doing a  'cdk-bootstrap' (needs done for every new account)
      code: lambda.Code.fromAsset('rekognitionlambda'),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'index.handler',
      timeout: Duration.seconds(30),
      memorySize: 1024,
      environment: {
        "TABLE": table.tableName,
        "BUCKET": imageBucket.bucketName
      }
    });
    // to trigger lambda when object(image) created in s3
    rekFn.addEventSource(new event_sources.S3EventSource(imageBucket, {events: [s3.EventType.OBJECT_CREATED]}))
    // Permission to read from s3
    imageBucket.grantRead(rekFn);
    // permission to allow the result of rekognition service from the sent image to be stored in dynamodb
    table.grantWriteData(rekFn);

    rekFn.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      // permission policy to allow label detection from rekognition across all resources
      actions: ['rekognition:DetectLabels'],
      resources: ['*']
    }))



    // The code that defines your stack goes here

  }
}
