# Pullet

Pullet is an eggs spawner (for ES2015 and Node)

## Install

```shell
npm install git+https://git@github.com/k33g/pullet.git --save
```

## What is an Egg?

You can see an Egg (of Pullet.js) as Immutable Wrapper of a Unique Value (Some would say it's a computational context 😉).

Special tribute to [Damien Gouyette](https://twitter.com/cestpasdur) about the choice of the word **Egg**

Let's look at an example:

```javascript
const Egg = require('./index').Egg

let Bob = new Egg("Bob Morane")
// or
let Bob = Egg.of("Bob Morane")

// you can read the value of Bob
Bob.value() == "Bob Morane" 
```

## A Puppet's Egg comes with an interesting `when()` method

I really ❤️ the `when{}` block of **Kotlin** and pattern matching of **Scala** because they provide a better readability.

### Define types implementing Puppet's Egg

Define 2 types "of Eggs" and create a function that returns one or the other

```javascript
class Yes extends Egg {}
class No extends Egg {}

let findtheGoodNumber = (value) => value == 42 ? Yes.of(42) : No.of(value)
```

Each `Egg` instance comes with a "particular" form of the switch-case statement:

You can test the type of the return instance, and then extract the value of the `Egg` instance:

```javascript
let result = findtheGoodNumber(42).when({
  No: badValue => `${badValue} is a bad value`,        
  Yes: (value) => value,
  _: () => "😡 ouch something went bad" // otherwise
})

result == 42
```

Or:

```javascript
let result = findtheGoodNumber(24).when({
  No: badValue => `${badValue} is a bad value`,        
  Yes: (value) => value,
  _: () => "😡 ouch something went bad" // otherwise
})

result == "24 is a bad value"
```

## You can do a lot of things with Puppet's Eggs

```javascript
const Egg = require('./index').Egg

class Functor extends Egg {
  map (fn) {
    return new this.constructor(fn(this.value()));
  }
}

class Toon extends Functor {}

class Success extends Egg {}
class Failures extends Egg {}

function checkTinyToon(toon) {
  let failures = []
  if(toon.value().name == undefined) failures.push("no name")
  if(toon.value().avatar == undefined) failures.push("no avatar")
  if(failures.length !== 0) return Failures.of(failures)
  return Success.of(toon)
}

console.log(
  checkTinyToon(Toon.of({name: "Buster", avatar: "🐰"})).when({
    Failures: messages => messages.join("|"),
    Success: toon => toon.map(fields => `${fields.name} is a ${fields.avatar}`).value()
  })
)
// Buster is a 🐰

console.log(
  checkTinyToon(Toon.of({})).when({
    Failures: messages => messages.join("|"),
    Success: toon => toon.map(fields => `${fields.name} is a ${fields.avatar}`).value()
  })
)
// no name|no avatar
```

## when() is very convenient, so we provide a standalone version:

```javascript
const Egg = require('./index').Egg
const when  = require('./index').when


class Toon extends Egg {}
class TinyToon extends Toon {}


when(TinyToon.of({name: "Buster", avatar: "🐰"}))({
  Toon: value => console.log("Toon:", value), // extract the value of the Toon
  TinyToon: value => console.log("TinyToon:", value), // extract the value of the TinyToon
  Object: value => console.log("Object:", value), // get the object itself
  Number: value => console.log("Number:", value),
  String: value => console.log("String:", value),
  Array: value => console.log("Array:", value),
  _: (value) => console.log("😡", value)
})
// will print TinyToon: { name: 'Buster', avatar: '🐰' }

when(42)({
  Toon: value => console.log("Toon:", value), // extract the value of the Toon
  TinyToon: value => console.log("TinyToon:", value), // extract the value of the TinyToon
  Object: value => console.log("Object:", value), // get the object itself
  Number: value => console.log("Number:", value),
  String: value => console.log("String:", value),
  Array: value => console.log("Array:", value),
  _: (value) => console.log("😡", value)
})

// will print Number: 42
```

## I'm using it with a side project (about microservices)

```javascript
// publish the service, then start the service
service.createRegistration(resultOfRegistration => {
  resultOfRegistration.when({
    // the service is registered
    Result: registrationResult => {
      console.log(registrationResult.record.registration, registrationResult.message)
      service.listen(port, startResult => {
        startResult.when({
          // the service is up, then we start the service
          Result: updateResult => {
            console.log(updateResult.record.registration, updateResult.message)
            console.log(`🌍 Service ${updateResult.record.name} is ${updateResult.record.status} - listening on ${port}`)
          },
          Failure: err =>
            console.log(`😡 Houston? we have a problem!`)
        })
      })
    },
    Failure: error => console.log("😡", error),
  })
})
```