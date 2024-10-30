import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
//import { Bucket, BlockPublicAccess, BucketEncryption, BucketPolicy } from 'aws-cdk-lib/aws-s3';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';

interface SubStackProps extends StackProps{
  TrailBucket: s3.Bucket;
  kmsKey: Key;
  region: string;
  accountid: string;
}
 


export class Cloudtrailstack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SubStackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: `${props.region}`, // リージョンを指定
      },
    });

    const sourceAccountId = props.accountid; // ソースアカウントIDを指定

    //GuardDuty有効
    const cloudTrail = new cloudtrail.Trail(this, 'CloudTrail', {
      bucket:props.TrailBucket ,
      encryptionKey: props.kmsKey,
      trailName:'GenUTrail',

    }
    );
    
        }}