# Pull base image.
FROM lineberty/nodejs:node-0.12

MAINTAINER Lineberty <contact@lineberty.com>

RUN mkdir /data/app
COPY package.json /data/app/package.json
COPY lib /data/app/lib
COPY app.js /data/app/app.js
COPY config.js /data/app/config.js

RUN cd /data/app; npm install

EXPOSE  80

# Define default command.
CMD ["node", "/data/app/app.js"]
