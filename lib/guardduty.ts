import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
//import { Bucket, BlockPublicAccess, BucketEncryption, BucketPolicy } from 'aws-cdk-lib/aws-s3';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import { Stack, StackProps, Duration } from 'aws-cdk-lib';

interface SubStackProps extends StackProps {
  region: string;
  accountid: string;
}
 


export class Guarddutystack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SubStackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: `${props.region}`, // リージョンを指定
      },
    });

    const sourceAccountId = props.accountid; // ソースアカウントIDを指定

    //GuardDuty有効化
    const guardDuty = new guardduty.CfnDetector(this, 'GuardDutyDetector', {
      enable: true,
    });
    
        }}