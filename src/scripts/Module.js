class Module {
  mount(element, context, properties) {
    this.context = context;
    this.element = element;
    this.properties = properties;
  }

  static getQualiferName() {
    return this.__namespace.concat(this.name).join('.').toLowerCase();
  }

  unMount(){
    this.element.parentElement.removeChild(this.element);
    this.context = null;
    this.element = null;
    this.unmounted();
  }

  unmounted() { }

  mounted() { }
}

Module.createSubClass = function createDummy(name){
  var base = new Module();
  var subClass = new Function(
    `return function ${name} () {
      this.mount = function ${base.mount.toString()}
      this.unmount = function ${base.unmounted.toString()}
      this.mounted = function ${base.mounted.toString()}
      this.unmounted = function ${base.mounted.toString()}
    }` )();
  subClass.getQualiferName = Module.getQualiferName;

  return subClass;
};

Module.prototype.attachListOf = function (moduleClass, mountPoint, listenable) {
  var cache = [];
  listenable((propertyList)=> {
    if (cache.length < propertyList.length) {
      while(cache.length < propertyList.length) {
        var index = cache.length;
        var viewModel = propertyList[index];
        var module = Modulin.createModule(mountPoint, moduleClass, {viewModel});
        cache.push(module);
      }
    }

    else if (cache.length > propertyList.length) {
      var removeItems = cache.splice(propertyList.length);
      removeItems.forEach((item)=> { item.unMount(); });
    }

    cache.forEach((module, index)=> {
      var viewModel = propertyList[index];
      var values = viewModel.__properties;

      module.context.viewModel = viewModel;

      for (var key in values) {
        if (values.hasOwnProperty(key)) {
          var diff = {};
          diff[key] = values[key];
          module.update(diff);
        }
      }
    })
  })
};
