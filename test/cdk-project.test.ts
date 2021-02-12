import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as DevhrProject from '../lib/cdkMainStack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new DevhrProject.CdkMainStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
