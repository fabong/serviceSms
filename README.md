# smsService

## Overview

smsService is a sms sender and receiver application. It allows services or users to send sms but also to get a response of it.

## Database

### Subscription collection

```js
{
    _id: {type: String, default: function () { return new ObjectId();}},
    serviceUrl: {type: String, required: true, index: true},
    callbackPath: {type: String, required: true},
    phone: {type: String, required: true, index: true},
    description: {type: String, required: true},
    lang: {type: String, default: null},
    createdAt: {type: Number, required: true}
}
```

### Response collection

Received Sms is stores in this collection when there is multiple subscription on the same phone

```js
{
    _id: {type: String, default: function () { return new ObjectId();}},
    phone: {type: String, required: true, index: true},
    msg: {type: String, required: true},
    pos: {type: Number, default: 0},
    createdAt: {type: Number, required: true}
}
```


## Run

To run, you need to specify some environment variables with your own settings as :

```
config='{"ovh":{"key":"ovh-key", "secret":"ovh-secret", "consumerKey":"ovh-consumerKey", "endpoint":"ovh-endpoint", "sender":"ovh-sender"}, "token":"1234", "mongoUrl":"mongodb://localhost/smsService"}' PORT=8082 node app.js
```

Or modify the *config.js* and just run it like this :

```
node app.js
```


By default, the port is 8082, you could modify it with the variable **PORT**
