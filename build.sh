#!/bin/bash
source VERSION

docker build -t lineberty/servicesms .
docker tag lineberty/servicesms lineberty/servicesms:$VERSION
docker push lineberty/servicesms
