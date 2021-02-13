import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkMainStack from '../lib/cdkMainStack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CdkMainStack.CdkMainStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
