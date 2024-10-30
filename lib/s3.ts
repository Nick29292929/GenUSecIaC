import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
//import { Bucket, BlockPublicAccess, BucketEncryption, BucketPolicy } from 'aws-cdk-lib/aws-s3';

import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Key } from 'aws-cdk-lib/aws-kms';


interface SubStackProps extends StackProps {
  kmsKey: Key;
  region: string;
  accountid: string;
}
 


export class S3stack extends cdk.Stack {
  public readonly configBucket: s3.Bucket;
  public readonly TrailBucket: s3.Bucket;
  public readonly CanaryBucket: s3.Bucket;
  constructor(scope: Construct, id: string, props: SubStackProps, ) {
    super(scope, id, {
      ...props,
      env: {
        region: `${props.region}`, // リージョンを指定
      },
    });

    const sourceAccountId = props.accountid; // ソースアカウントIDを指定
 
    // S3バケットの作成
    const configBucket = new s3.Bucket(this, 'ConfigS3Bucket', {
      bucketName: 'ac-config-s3-008971664628-2',
      encryption: s3.BucketEncryption.KMS, // カスタムKMSキーを使用
      encryptionKey: props.kmsKey, // 作成したKMSキーを指定
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // パブリックアクセスを完全に制限
      versioned: false, // バージョニングを無効にする
      lifecycleRules: [
        {
          id: 'ac-config-lifecycle',
          enabled: true,
          expiration: Duration.days(365), // 365日後にオブジェクトを削除
        },
      ],
    });

    const GuardDutyBucket = new s3.Bucket(this, 'GuardDutyS3Bucket', {
      bucketName: 'ac-guardduty-s3-008971664628-2',
      encryption: s3.BucketEncryption.KMS, // カスタムKMSキーを使用
      encryptionKey: props.kmsKey, // 作成したKMSキーを指定
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // パブリックアクセスを完全に制限
      versioned: false, // バージョニングを無効にする
      lifecycleRules: [
        {
          id: 'ac-guardduty-lifecycle',
          enabled: true,
          expiration: Duration.days(365), // 365日後にオブジェクトを削除
        },
      ],
    });

    const TrailBucket = new s3.Bucket(this, 'TrailS3Bucket', {
      bucketName: 'ac-cloudtrail-s3-008971664628-2',
      encryption: s3.BucketEncryption.KMS, // カスタムKMSキーを使用
      encryptionKey: props.kmsKey, // 作成したKMSキーを指定
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // パブリックアクセスを完全に制限
      versioned: false, // バージョニングを無効にする
      lifecycleRules: [
        {
          id: 'ac-trail-lifecycle',
          enabled: true,
          expiration: Duration.days(365), // 365日後にオブジェクトを削除
        },
      ],
    });

    const CanaryBucket = new s3.Bucket(this, 'CanaryS3Bucket', {
      bucketName: 'ac-canary-s3-008971664628-2',
      encryption: s3.BucketEncryption.KMS, // カスタムKMSキーを使用
      encryptionKey: props.kmsKey, // 作成したKMSキーを指定
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // パブリックアクセスを完全に制限
      versioned: false, // バージョニングを無効にする
      lifecycleRules: [
        {
          id: 'ac-Canary-lifecycle',
          enabled: true,
          expiration: Duration.days(365), // 365日後にオブジェクトを削除
        },
      ],
    });

    // S3バケットにタグを付ける
    cdk.Tags.of(configBucket).add('Customer', 'Customer');
    cdk.Tags.of(configBucket).add('Name', 'ac-config-s3-008971664628-2');
    cdk.Tags.of(GuardDutyBucket).add('Customer', 'Customer');
    cdk.Tags.of(GuardDutyBucket).add('Name', 'ac-guardduty-s3-008971664628-2');
  

    // バケットポリシーを追加してConfigからのアクセスを許可する
    const configBucketPolicy = new s3.BucketPolicy(this, 'ConfigS3BucketPolicy', {
      bucket: configBucket,
    });

    
    // Configバケットポリシーの定義
    configBucketPolicy.document.addStatements(
      new PolicyStatement({
        sid: 'AWSConfigBucketPermissionsCheck', // バケットアクセス権限のチェック
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('config.amazonaws.com')], // AWS Configサービスを許可
        actions: ['s3:GetBucketAcl'],
        resources: [`${configBucket.bucketArn}`],
        conditions: {
          StringEquals: {
            'AWS:SourceAccount': sourceAccountId, // ソースアカウントIDを指定
          },
        },
      }),
      new PolicyStatement({
        sid: 'AWSConfigBucketExistenceCheck', // バケットの存在チェック
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('config.amazonaws.com')],
        actions: ['s3:ListBucket'],
        resources: [`${configBucket.bucketArn}`],
        conditions: {
          StringEquals: {
            'AWS:SourceAccount': sourceAccountId,
          },
        },
      }),
      new PolicyStatement({
        sid: 'AWSConfigBucketDelivery', // Configデータの配信
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('config.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${configBucket.bucketArn}/AWSLogs/${sourceAccountId}/Config/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control', // バケット所有者に完全なアクセス権を付与
            'AWS:SourceAccount': sourceAccountId,
          },
        },
      })
    );

    //GurdDutyバケットポリシー追加
    const guarddutyBucketPolicy = new s3.BucketPolicy(this, 'GuardDutyS3BucketPolicy', {
      bucket: GuardDutyBucket,
    });

    // GurdDutyバケットポリシーの定義
    guarddutyBucketPolicy.document.addStatements(
      new PolicyStatement({
        sid: 'DenyNonHTTPSAccess',
        effect: iam.Effect.DENY,
        principals: [new iam.ServicePrincipal('guardduty.amazonaws.com')],
        actions: ['s3:*'],
        resources: [`${GuardDutyBucket.bucketArn}/*`],
        conditions: {
          Bool: { 'aws:SecureTransport': 'false' },
          },
        }),
      new PolicyStatement({
        sid: 'DenyIncorrectEncryptionHeader',
        effect: iam.Effect.DENY,
        principals: [new iam.ServicePrincipal('guardduty.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${GuardDutyBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id': props.kmsKey.keyArn,
          },
        },
      }),
      new PolicyStatement({
        sid: 'DenyUnencryptedObjectUploads',
        effect: iam.Effect.DENY,
        principals: [new iam.ServicePrincipal('guardduty.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${GuardDutyBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      }),
    

      new PolicyStatement({
        sid: 'AllowPutObject',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('guardduty.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${GuardDutyBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            'aws:SourceAccount': sourceAccountId,
            'aws:SourceArn': 'arn:aws:guardduty:ap-northeast-1:537124955427:detector/38c8efb9518e44ada7dce8cff2d8f2ca',
          },
       },
      }),
      new PolicyStatement({
        sid: 'AllowGetBucketLocation',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('guardduty.amazonaws.com')],
        actions: ['s3:GetBucketLocation'],
        resources: [GuardDutyBucket.bucketArn],
       },
    ));


    TrailBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck20150319-611df788-d3dc-4af2-b28f-eba37b216a52',
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [new cdk.aws_iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [`${TrailBucket.bucketArn}`],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudtrail:ap-northeast-1:${sourceAccountId}:trail/GenUTrail`,
          },
        },
      })
    );
    TrailBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: 'AWSCloudTrailWrite20150319-6d0c3db9-47f8-49b7-996c-5fcbf2dc37a3',
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [new cdk.aws_iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${TrailBucket.bucketArn}/AWSLogs/${sourceAccountId}/*`],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudtrail:ap-northeast-1:${sourceAccountId}:trail/GenUTrail`,
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      })
      );

    // Output the S3 Bucket ARN
    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: TrailBucket.bucketArn,
      description: 'The ARN of the S3 Bucket',
    });

    this.configBucket = configBucket;
    this.TrailBucket = TrailBucket;
    this.CanaryBucket = CanaryBucket;
   
  }}
    
