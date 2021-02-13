import * as cdk from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import {Duration} from '@aws-cdk/core';
import iam = require('@aws-cdk/aws-iam');
import event_sources = require('@aws-cdk/aws-lambda-event-sources');

const imageBucketName = "dbrocdkimagebucket"

export class CdkMainStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //  s3.Bucket -> ".Bucket" is the constructor, passing in 'this' as the scope
    const imageBucket = new s3.Bucket(this, imageBucketName, {
      // very important to have to be auto remove bucket
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })
    new cdk.CfnOutput(this, 'imageBucket', {value: imageBucket.bucketName});

    // dynamoDB -> Stores the image labels
    const imageTable = new dynamodb.Table(this, 'ImageLabels', {
      // partitionKey is a property off the table with name 'image'
      // Creating a no-sql, key-value store, providing a value to search for
      partitionKey: {name: 'image', type: dynamodb.AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    new cdk.CfnOutput(this, 'cdkTable', {value: imageTable.tableName});

    // lambda -> Allowing to run our function serverless
    // logical id of lambda is "rekognitionFunction"
    const rekognitionLambdaFunc = new lambda.Function(this, 'rekognitionFunction', {
      // providing a directory that CDK can use to create/deploy an artifact
      // cdk creates a zip file and pushed to staging bucket in the account
      // this bucket is created after doing a  'cdk-bootstrap' (needs done for every new account)
      code: lambda.Code.fromAsset('rekognitionlambda'),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'index.handler',
      timeout: Duration.seconds(30),
      memorySize: 1024,
      environment: {
        "TABLE": imageTable.tableName,
        "BUCKET": imageBucket.bucketName
      }
    });

    // to trigger lambda when object(image) created in s3
    rekognitionLambdaFunc.addEventSource(new event_sources.S3EventSource(imageBucket, {events: [s3.EventType.OBJECT_CREATED]}))

    // Permission to read from s3
    imageBucket.grantRead(rekognitionLambdaFunc);

    // permission to allow the result of rekognition service from the sent image to be stored in dynamodb
    imageTable.grantWriteData(rekognitionLambdaFunc);

    rekognitionLambdaFunc.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      // permission policy to allow label detection from rekognition across all resources
      actions: ['rekognition:DetectLabels'],
      resources: ['*']
    }))

  }
}
