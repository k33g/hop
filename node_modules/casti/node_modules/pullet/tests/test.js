'use strict';

var expect = require('chai').expect;

const Egg = require('../index').Egg

describe('#use the value() method to get the value of an Egg', () => {
  it('should equal 42', () => {
    expect(Egg.of(42).value()).to.equal(42);
  });
});

describe('#an Egg is immutable', () => {
  it(`can't change value of an Egg`, () => {
    let Bob = new Egg({firstName: "Bob", lastName: "Morane"})
    Bob.value().firstName = "Boby"
    Bob.value().lastName = "Lapointe"
    expect(`${Bob.value().firstName} ${Bob.value().lastName}`).to.equal(`Bob Morane`)
  });
});


describe('#when() method of an Egg is a kind of pattern matching', () => {
  class Yes extends Egg {}
  class No extends Egg {}

  let findtheGoodNumber = (value) => 
    value == 42 ? Yes.of(42) : No.of(value)
  

  it(`It should return a Yes`, () => {
    expect(
      findtheGoodNumber(42).constructor
    ).to.equal(Yes.prototype.constructor)
  });

  it(`It should return a No`, () => {
    expect(
      findtheGoodNumber(22).constructor
    ).to.equal(No.prototype.constructor)
  });  

  it(`the value of Yes of 42 should be 42`, () => {
    expect(
      findtheGoodNumber(42).when({
        No: badValue => badValue,        
        Yes: (value) => value,
        _: () => "😡 ouch something went bad"
      })
    ).to.equal(42)
  });

  it(`the value of No of 24 should be 24`, () => {
    expect(
      findtheGoodNumber(24).when({
        No: badValue => badValue,        
        Yes: (value) => value,
        _: () => "😡 ouch something went bad"
      })
    ).to.equal(24)
  });

});

describe('#create Functors with an Eggs', () => {
  
  class Functor extends Egg {
    map (fn) {
      return new this.constructor(fn(this.value()));
    }
  }

  class Success extends Egg {}
  class Failures extends Egg {}

  class Toon extends Functor {}
  
  function checkToon(toon) {
    let failures = []
    if(toon.value().name == undefined) failures.push("no name")
    if(toon.value().avatar == undefined) failures.push("no avatar")
    if(failures.length !== 0) return Failures.of(failures)
    return Success.of(toon.map(fields => `${fields.name} is a ${fields.avatar}`).value())
  }
  
  it(`A toon should have a name and an avatar`, () => {

    let buster = Toon.of({name:"Buster", avatar:"🐰"})

    expect(
      checkToon(buster).when({
        Failures: (errors) => errors,
        Success: toon => toon,
        _: () => "😡 ouch somethig went bad"
      })
    ).to.equal("Buster is a 🐰")

  });
  
  it(`it should return 2 errors`, () => {
    
    let buster = Toon.of({})

    expect(
      checkToon(buster).when({
        Failures: (errors) => {
          console.log(errors)
          return errors
        },
        Success: toon => toon,
        _: () => "😡 ouch somethig went bad"
      }).join("|")
    ).to.equal("no name|no avatar")

  });
  
});  



