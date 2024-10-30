import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
//import { Bucket, BlockPublicAccess, BucketEncryption, BucketPolicy } from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as target from 'aws-cdk-lib/aws-events-targets';
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
interface SubStackProps extends StackProps {
  region: string;
  accountid: string;
}
 
 


export class Snseventstack extends cdk.Stack {
  public readonly snsTopic: sns.Topic;
  constructor(scope: Construct, id: string, props: SubStackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: `${props.region}`, // リージョンを指定
      },
    });


    // 配信チャネルはリコーダーが作成されてから必要
    //deliveryChannel.node.addDependency(recorder);

    const snsTopic = new sns.Topic(this, "guardduty-notifications-snstopic",{
      displayName: "guardduty-notifications-snstopic",
      topicName: "guardduty-notifications-snstopic",
    });

    snsTopic.addSubscription(new subs.EmailSubscription('aws-genu-alert@dts.co.jp'));

    const eventBridgeRule1 = new events.Rule(this, 'guardduty-notifications-eventrule', {
      eventPattern: {
        source: ['aws.guardduty'],
        detailType: ['GuardDuty Finding'],
        detail: {
          severity: [
            { numeric: ['>=', 7] }
          ]
        }
      },
      ruleName: 'guardduty-notifications-eventrule'
    });

    const eventBridgeRule2 = new events.Rule(this, 'guardduty2-notifications-eventrule', {
      eventPattern: {
        source: ['aws.guardduty'],
        detailType: ['GuardDuty Finding'],
        detail: {
          service: {
            action: {
              awsApiCallAction:{
                api:['ConsoleLogin'],
                serviceName:['signin.amazonaws.com']
              }
            }
          }
        }
      },
      ruleName: 'guardduty2-notifications-eventrule'
    });
    eventBridgeRule1.addTarget(new target.SnsTopic(snsTopic, {
      message: events.RuleTargetInput.fromText(
        `AWS ${events.EventField.fromPath('$.detail.accountId')} has a severity ${events.EventField.fromPath('$.detail.severity')} GuardDuty finding type ${events.EventField.fromPath('$.detail.type')} in the ${events.EventField.fromPath('$.region')} region.\n` +
        `Resource_Type:${events.EventField.fromPath('$.detail.resource.resourceType')}\n` +
        `Finding Description:${events.EventField.fromPath('$.detail.description')}\n` +
        `For more details open the GuardDuty console at https://${events.EventField.fromPath('$.region')}.console.aws.amazon.com/guardduty/home?region=${events.EventField.fromPath('$.region')}#/findings?search=id%3D${events.EventField.fromPath('$.detail.id')}&macros=current\n`
      )}));
      eventBridgeRule2.addTarget(new target.SnsTopic(snsTopic, {
        message: events.RuleTargetInput.fromText(
          `AWS ${events.EventField.fromPath('$.detail.accountId')} has a severity ${events.EventField.fromPath('$.detail.severity')} GuardDuty finding type ${events.EventField.fromPath('$.detail.type')} in the ${events.EventField.fromPath('$.region')} region.\n` +
          `Resource_Type:${events.EventField.fromPath('$.detail.resource.resourceType')}\n` +
          `Finding Description:${events.EventField.fromPath('$.detail.description')}\n` +
          `For more details open the GuardDuty console at https://${events.EventField.fromPath('$.region')}.console.aws.amazon.com/guardduty/home?region=${events.EventField.fromPath('$.region')}#/findings?search=id%3D${events.EventField.fromPath('$.detail.id')}&macros=current\n`
        )}));
        this.snsTopic = snsTopic;
        }}