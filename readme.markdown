# keyboot

single sign-on offline key server using asymmetric crypto
in the browser with [hyperboot](http://hyperboot.org) for caching

# example

To get your own keyboot server up and running, just do:

```
$ npm install -g keyboot
$ keyboot server -p 8000
```

For a full working example, consult:

* [http://keyboot.hyperboot.org](http://keyboot.hyperboot.org)
* [http://keyboot-example-app.hyperboot.org](http://keyboot-example-app.hyperboot.org)

and the [keyboot-example-app](https://github.com/substack/keyboot-example-app)
source code.

# methods

To build applications that talk to keyboot, you can use these methods from your
browser code.

```
var keyboot = require('keyboot')
```

## var kb = keyboot(url, opts={})

Connect to the keyboot app running at `url` in a hidden iframe.

Request `opts.permissions`, an array of permissions that map to methods
available on `kb`:

* `'sign'`
* `'fingerprint'`
* `'publicKey'`

## kb.sign(text, cb)

Sign a string or array buffer `text`.

`cb(err, res)` fires with an error or a Uint8Array signed blob `res`.

## kb.fingerprint(cb)

Request a fingerprint.

`cb(err, hash)` fires with an error or the fingerprint `hash` that uniquely
identifies the user by the hash of their public key.

## kb.publicKey(cb)

Request the user's public key.

`cb(err, pubkey)` fires with an error or a json web key (JWK) for the user's
public key.

# events

The keyboot interface sets up an event bus internally using
[page-bus](https://npmjs.org/package/page-bus)
that emits events for authorization state changes.

## kb.on('approve', function () {})

Emitted when the authorization request was approved.

## kb.on('reject', function () {})

Emitted when the authorization request was rejected.

## kb.on('revoke', function () {})

Emitted when previously-accepted access is revoked.

## kb.on('pending', function () {})

Emitted when the instance is waiting for an answer to the access request from
the remote keyboot app.

This is a good time to show the user a link to the keyboot url so they can
approve the application.

# usage

This package ships with a `keyboot` command for quickly starting up a server:

```
keyboot server { -p PORT, -d DIR, --verbose }

  Start a keyboot server on PORT, writing hyperboot files to DIR.
  
  If --verbose, print each http request.

```

# install

With [npm](https://npmjs.org), to get the library do:

```
$ npm install keyboot
```

and to get the keyboot command do:

```
$ npm install -g keyboot
```

or you can fetch a pre-built version of the browser library with
[browserify cdn](http://wzrd.in):

[http://wzrd.in/standalone/keyboot@latest](http://wzrd.in/standalone/keyboot@latest)

# license

MIT
