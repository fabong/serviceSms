# smsService

## Overview

smsService is a sms sender and receiver application. It allows services or users to send sms but also to get a response of it.

## Available routes

### Header

You have to send for all routes the token in the header

| Parameters | Types  | Required | Other information                |
| ---------- | ------ | -------- | -------------------------------- |
| token      | string | true     |                                  |

### Send

This route sends the sms with the request parameters and subscribes a callback if there is both of callbackUrl and description parameters.

#### Request Parameters

| Parameters  | Types  | Required | Other information                                                      |
| ----------- | ------ | -------- | ---------------------------------------------------------------------- |
| phone       | string | true     | the phone number to send the sms                                       |
| msg         | string | true     | the message to send                                                    |


#### Response

Return a 200 code status if the sms is correctly sent.

[See also subscribe](#subscribe)

### Subscribe

This route subscribes a callback for a response from the sms receiver.
*If you want to register a callback with the same phone and serviceUrl than an existing one*, **the new register will overwrite it**.

** The serviceUrl and callbackPath has to point to a POST route which accepts to receive an [incomingSms](#incomingSms) object.

#### Request Parameters

| Parameters   | Types   | Required | Other information                                                      |
| ------------ | ------- | -------- | ---------------------------------------------------------------------- |
| phone        | string  | true     | the phone number to send the sms                                       |
| serviceUrl   | string  | true     | the service url to send the response of the receiver                   |
| callbackPath | string  | true     | the relative url to send the response of the receiver                  |
| description  | string  | true     | a description if there is more than one subscription on the same phone |
| lang         | string  | false    | the language used for some response                                    |

#### Response

Return a 200 code status if the callback is correctly registered and the sent sms.

[See also send](#send)
[See also incomingSms](#incomingSms)

#### IncomingSms

IncomingSms is the object returned to the serviceUrl and callbackPath when a sms is received.

| Parameters   | Types   | Required | Other information                                                      |
| ------------ | ------- | -------- | ---------------------------------------------------------------------- |
| phone        | string  | true     | the phone number of the sender                                         |
| msg          | string  | true     | the message of the incoming sms                                        |
| description  | string  | false    | a description if there is more than one subscription on the same phone |
| time         | number  | true     | the time when the sms was received by the provider                     |



### Unsubscribe

This route unsubscribe a response callback.

#### Request Parameters

| Parameters  | Types   | Required | Other information                                    |
| ----------- | ------- | -------- | ---------------------------------------------------- |
| phone       | string  | true     | the phone number to send the sms                     |
| serviceUrl  | string  | true     | the service url to send the response of the receiver |

#### Response

Return a 200 code status if the callback is correctly unregistered.

[See also subscribe](#subscribe)

## Database

### Subscription collection

```js
{
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
DEBUG=* node app.js
```


By default, the port is 8082, you could modify it with the variable **PORT**
