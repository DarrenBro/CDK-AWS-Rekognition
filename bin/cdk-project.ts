#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkMainStack } from '../lib/cdkMainStack';

// app construct, initialising app here
const app = new cdk.App();
new CdkMainStack(app, 'cdkMainStack');
