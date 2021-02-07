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

    // lambda
    const rekFn = new lambda.Function(this, 'rekognitionFunction', {
      code: lambda.Code.fromAsset('rekognitionlambda'),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'index.handler'
    });



    // The code that defines your stack goes here

  }
}
