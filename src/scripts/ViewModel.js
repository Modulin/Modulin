class ViewModel {
  constructor(properties){
    var get = this.get.bind(this);
    var set = this.set.bind(this);
    this.set = (property, value)=> set(properties, property, value);
    this.get = (property)=> get(properties, property);
    this.listeners = [];
  }

  set(properties, property, value){
    properties[property] = value;

    var diff = {};
    diff[property] = value;
    this.triggerChange(diff);
  }

  get(properties, property){
    return properties[property];
  }

  onChange(callback){
    this.listeners.push(callback);
  }

  triggerChange(diff){
    this.listeners.forEach((listener)=>listener(diff));
  }
}