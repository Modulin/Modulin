class Module {
  inject(element, context) {
    this.context = context;
    this.element = element; }

  static getQualiferName(){
    return this.__namespace.concat(this.name).join('.').toLowerCase(); }

  unmounted(){}

  mounted(){ } }

Module.prototype.attachListOf = function(moduleClass, mountPoint, listenable){
  var cache = [];
  listenable((propertyList)=>{
    if(cache.length < propertyList.length){
      var viewModel = new ViewModel({});
      var context = {viewModel: viewModel};
      var module = Moduli.createModule(mountPoint, moduleClass, context);
      cache.push(module); }

    else if(cache.length > propertyList.length){
      var removeItems = cache.splice(propertyList.length);
      removeItems.forEach((item)=>{
        var el = item.element;

        item.unmounted();
        item.context = null;
        item.element = null;

        el.parentElement.removeChild(el); }); }

    cache.forEach((module, index)=>{
      var values = propertyList[index];

      for(var key in values){
        if(values.hasOwnProperty(key)){
          module.context.viewModel.set(key, values[key]); } } }) }) };
