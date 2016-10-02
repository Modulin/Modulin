class ViewModel {
  constructor(properties){
    this.__properties = properties;
    this.__listeners = []; }

  set(property, value){
    this.__properties[property] = value;

    var diff = {};
    diff[property] = value;
    this.triggerChange(diff); }

  get(property){
    return this.__properties[property]; }

  getListenable(key){
    return (callback)=>{
      this.onChange(key, (properties)=>callback(properties[key])); } }

  onChange(propertyOrCallback, callback){
    var property = propertyOrCallback;
    if(!callback){
      property = null;
      callback = propertyOrCallback;
    }
    if(property){
      this.__listeners.push((diff)=>{
        var value = diff[property];
          if(value !== undefined){
            callback(diff); }})}
    else {
      this.__listeners.push(callback); }

    var properties = Object
      .keys(this.__properties)
      .reduce((obj, key)=>{obj[key] = this.__properties[key]; return obj;}, {});
    callback(properties);}

  triggerChange(diff){
    this.__listeners.forEach((listener)=>listener(diff)); } }