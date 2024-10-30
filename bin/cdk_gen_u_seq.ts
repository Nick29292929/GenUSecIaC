#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {S3stack} from '../lib/s3';
import {KMSstack} from '../lib/kms';
import {Configstack} from '../lib/config';
import {Cloudtrailstack} from '../lib/cloudtrail';
import {Snseventstack} from '../lib/snsevent';
import {Guarddutystack} from '../lib/guardduty';
import {Canarystack} from '../lib/canary';


const region = 'ap-northeast-1';
const accountid = '008971664625';

const app = new cdk.App();



const kmsstack = new KMSstack(app, "CdkGenUSeqStack", {
    region: region,
    accountid: accountid,
});
const s3stack = new S3stack(app, 'S3stack', {
    kmsKey: kmsstack.kmsKey,
    region: region,
    accountid: accountid,
});
const configstack = new Configstack(app, 'Configstack', {
    configBucket: s3stack.configBucket,
    region: region,
    accountid: accountid,
});

const cloudtrailstack = new Cloudtrailstack(app, 'Cloudtrailstack', {
    TrailBucket: s3stack.TrailBucket,
    kmsKey: kmsstack.kmsKey,
    region: region,
    accountid: accountid,
});

const snseventstack = new Snseventstack(app, 'Snseventstack', {
    region: region,
    accountid: accountid,
});

const guarddutystack = new Guarddutystack(app, 'Guarddutystack', {
    region: region,
    accountid: accountid,
});

const canarystack = new Canarystack(app, "Canarystack", {
    region: region,
    accountid: accountid,
    kmsKey: kmsstack.kmsKey,
    snsTopic: snseventstack.snsTopic,
    Canarybucket: s3stack.CanaryBucket,
    

});