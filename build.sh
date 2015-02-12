#!/bin/bash
source VERSION

docker build -t lineberty/push_sms .
docker tag lineberty/push_sms lineberty/push_sms:$VERSION
docker push lineberty/push_sms
