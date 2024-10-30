import * as cdk from 'aws-cdk-lib';
import * as synthetics from 'aws-cdk-lib/aws-synthetics';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';



interface SubStackProps extends StackProps{
  region: string;
  accountid: string;
  kmsKey: Key;
  snsTopic: sns.Topic;
  Canarybucket: s3.Bucket;
}

export class Canarystack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SubStackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: `${props.region}`, // リージョンを指定
      },
    });

    // KMS キーの参照 (東京リージョンに作成済みと仮定)
    const kmsKey = props.kmsKey;

    // SNS トピックの参照 (作成済みと仮定)
    const snsTopic = props.snsTopic;

    // Canary の作成
    const canary = new synthetics.Canary(this, 'AcCloudwatchCanary', {
      canaryName: 'ac-cloudwatch-canary',
      runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_6_2,
      test: synthetics.Test.custom({
        code: synthetics.Code.fromInline(`
          const synthetics = require('Synthetics');
          const log = require('SyntheticsLogger');

          const pageLoadBlueprint = async function () {
            // GenU の URL を設定
            const URL = 'https://d3nz8ttg3jxs16.cloudfront.net/';

            let page = await synthetics.getPage();
            const response = await page.goto(URL, {waitUntil: 'domcontentloaded', timeout: 30000});
            
            // ステータスコードをチェック
            if (response.status() !== 200) {
              throw new Error('Failed to load page');
            }

            // ここに追加のチェックを実装できます

            await synthetics.takeScreenshot('loaded', 'loaded');
            let pageTitle = await page.title();
            log.info('Page title: ' + pageTitle);
          };

          exports.handler = async () => {
            return await pageLoadBlueprint();
          };
        `),
        handler: 'index.handler',
      }),
      schedule: synthetics.Schedule.rate(cdk.Duration.minutes(5)),
      environmentVariables: {
        // 必要に応じて環境変数を追加
        'CANARY_KMS_KEY_ARN': props.kmsKey.keyArn,
      },
      
      startAfterCreation : true,

      

      artifactsBucketLocation: {
        bucket: props.Canarybucket,
        prefix: 'canaries-artifacts/'
      },
      artifactsBucketLifecycleRules: [{
        enabled: true,
        id: 'CanaryArtifactsExpiration',
        expiration: cdk.Duration.days(31),
      }],

    }
  );

    // データ保持期間の設定
    canary.role?.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:GetBucketLocation', 's3:GetOblect', 's3:ListAllMyBuckets'],
      resources: [`${props.Canarybucket.bucketArn}`,`${props.Canarybucket.bucketArn}/*`],
    }));

    // 暗号化の設定
    //canary.addEnvironment('AWS_KMS_KEY_ARN', kmsKey.keyArn);

    // アラームの作成

    const successPercentAlarm = new cloudwatch.Alarm(this, 'CanarySuccessPercentAlarm', {
      metric: canary.metricSuccessPercent(),
      threshold: 80,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // アラームにSNSアクションを追加
    successPercentAlarm.addAlarmAction(new actions.SnsAction(snsTopic));

    // タグの追加
    cdk.Tags.of(canary).add('Customer', 'Customer');
    cdk.Tags.of(canary).add('Name', 'ac-canary');
  }
}