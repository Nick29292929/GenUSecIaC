import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
//import { Bucket, BlockPublicAccess, BucketEncryption, BucketPolicy } from 'aws-cdk-lib/aws-s3';
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { CfnConfigurationRecorder, CfnDeliveryChannel } from 'aws-cdk-lib/aws-config';

import * as s3 from 'aws-cdk-lib/aws-s3';


interface SubStackProps extends StackProps{
  configBucket: s3.Bucket;
  region: string;
  accountid: string;
}

 


export class Configstack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SubStackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: `${props.region}`, // リージョンを指定
      },
    });

    // Config サービス用 IAM ロールの作成
    const configRole = new Role(this, 'ConfigRole', {
      assumedBy: new ServicePrincipal('config.amazonaws.com'), // AWS Configサービスが引き受ける
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole'), // 管理ポリシーをアタッチ
      ],
    });

    // Config リコーダーの作成
    const recorder = new CfnConfigurationRecorder(this, 'ConfigRecorder', {
      roleArn: configRole.roleArn, // 作成したIAMロールを指定
      recordingGroup: {
        allSupported: true, // すべてのサポートされているリソースタイプを記録
        includeGlobalResourceTypes: false, // グローバルリソース（IAM）は除外
      },
    });

    // Config 配信チャネルの作成
    const deliveryChannel = new CfnDeliveryChannel(this, 'ConfigDeliveryChannel', {
      s3BucketName: props.configBucket.bucketName, // 配信先のS3バケット
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'Six_Hours', // 配信頻度は6時間ごと
      },
    });


    // 配信チャネルはリコーダーが作成されてから必要
    //deliveryChannel.node.addDependency(recorder);
        }}