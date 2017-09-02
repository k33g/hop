class Egg {
  constructor(eggValue) {

    this.value = function() {
      if(eggValue.constructor.name == "Array") { return eggValue.map(item => item); }
      if(eggValue.constructor.name == "Object") { return Object.assign({}, eggValue); }
      return Object.assign({}, {value: eggValue}).value 
    }
    
  }
  static of(x) {
    return new this(x)
  }

  when(cases) {
    for(var type_name in cases) {
      if(this.constructor.name == type_name) {
        return cases[type_name](this.value())
      }
    }
    return cases["_"](this.value())
  }
}

let when = _object_ => {
  
  let getFirstAncestor = (o, save) => {
    let tmp = Object.getPrototypeOf(o)
    if(tmp.constructor.name != "Object") {
      save = tmp
      return getFirstAncestor(tmp, save)
    } else {
      return save == null ? {} : save
    }
  }
  // check the type of _object_
  if(getFirstAncestor(_object_).constructor.name == "Egg") {
    return (cases) => {
      for(var type_name in cases) {
        if(_object_.constructor.name == type_name) {
          return cases[type_name](_object_.value())
        }
      }
      return cases["_"](_object_.value())
    }
  } else {
    // use directly the object
    return (cases) => {
      for(var type_name in cases) {
        if(Object.getPrototypeOf(_object_).constructor.name == type_name) {
          return cases[type_name](_object_)
        }
      }
      return cases["_"](_object_)
    }    
  }
}

module.exports = {
  Egg: Egg,
  when: when
}