import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
//import { Bucket, BlockPublicAccess, BucketEncryption, BucketPolicy } from 'aws-cdk-lib/aws-s3';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Stack, StackProps, Duration } from 'aws-cdk-lib';

interface SubStackProps extends StackProps{
  region: string;
  accountid: string;
}
 


export class KMSstack extends cdk.Stack {

  public readonly kmsKey: Key;

  constructor(scope: Construct, id: string, props: SubStackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: `${props.region}`, // リージョンを指定
      },
    });

    const sourceAccountId = props.accountid; // ソースアカウントIDを指定


    // KMSキーの作成
    const kmsKey = new Key(this, 'ConfigS3KmsKey', {
      enableKeyRotation: true, // KMSキーの自動ローテーションを有効化
      policy: new cdk.aws_iam.PolicyDocument({
        statements: [
          new cdk.aws_iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: cdk.aws_iam.Effect.ALLOW,
            principals: [
              new cdk.aws_iam.ArnPrincipal(`arn:aws:iam::${sourceAccountId}:root`),
              new cdk.aws_iam.ArnPrincipal(`arn:aws:sts::${sourceAccountId}:assumed-role/AWSReservedSSO_AWSAdministratorAccessDTS_a34d5ea1c76eea2a/sa-ise@dts.co.jp`),
            ],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new cdk.aws_iam.PolicyStatement({
            sid: 'Allow CloudTrail to encrypt logs',
            effect: cdk.aws_iam.Effect.ALLOW,
            principals: [new cdk.aws_iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: ['kms:GenerateDataKey*'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'aws:SourceArn': `arn:aws:cloudtrail:ap-northeast-1:${sourceAccountId}:trail/GenUTrail`,
              },
              StringLike: {
                'kms:EncryptionContext:aws:cloudtrail:arn': `arn:aws:cloudtrail:*:${sourceAccountId}:trail/*`,
              },
            },
          }),
          new cdk.aws_iam.PolicyStatement({
            sid: 'Allow CloudTrail to describe key',
            effect: cdk.aws_iam.Effect.ALLOW,
            principals: [new cdk.aws_iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: ['kms:DescribeKey'],
            resources: ['*'],
          }),
          new cdk.aws_iam.PolicyStatement({
            sid: 'Allow principals in the account to decrypt log files',
            effect: cdk.aws_iam.Effect.ALLOW,
            principals: [new cdk.aws_iam.AccountRootPrincipal()],
            actions: ['kms:Decrypt', 'kms:ReEncryptFrom'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:CallerAccount': `${sourceAccountId}`,
              },
              StringLike: {
                'kms:EncryptionContext:aws:cloudtrail:arn': `arn:aws:cloudtrail:*:${sourceAccountId}:trail/*`,
              },
            },
          }),
          new cdk.aws_iam.PolicyStatement({
            sid: 'Allow alias creation during setup',
            effect: cdk.aws_iam.Effect.ALLOW,
            principals: [new cdk.aws_iam.AccountRootPrincipal()],
            actions: ['kms:CreateAlias'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:CallerAccount': `${sourceAccountId}`,
                'kms:ViaService': 'ec2.ap-northeast-1.amazonaws.com',
              },
            },
          }),
          new cdk.aws_iam.PolicyStatement({
            sid: 'Enable cross account log decryption',
            effect: cdk.aws_iam.Effect.ALLOW,
            principals: [new cdk.aws_iam.AccountRootPrincipal()],
            actions: ['kms:Decrypt', 'kms:ReEncryptFrom'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:CallerAccount': `${sourceAccountId}`,
              },
              StringLike: {
                'kms:EncryptionContext:aws:cloudtrail:arn': `arn:aws:cloudtrail:*:${sourceAccountId}:trail/*`,
              },
            },
          }),
          new cdk.aws_iam.PolicyStatement({
            sid: 'Allow GuardDuty to encrypt findings',
            effect: cdk.aws_iam.Effect.ALLOW,
            principals: [new cdk.aws_iam.ServicePrincipal('guardduty.amazonaws.com')],
            actions: ['kms:GenerateDataKey'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'aws:SourceAccount': `${sourceAccountId}`,
                'aws:SourceArn': 'arn:aws:guardduty:ap-northeast-1:008971664625:detector/36c885d02ba23198a7e1d516ca9d0286',
              },
            },
          }),
        ],
      }),
    });
    this.kmsKey = kmsKey;
  }}

   