class ModuleRegistry {

  constructor() {
    this.defaultNamespace = ['modulin'];
    this.registry = {};
  }

  register(parentOrModule, module) {
    var parent = null;
    var namespace = [];

    if (module) {
      parent = parentOrModule;
    }
    else {
      module = parentOrModule;
    }

    if (parent) {
      namespace = parent.__namespace.concat(parent.name);
    }
    else {
      namespace = this.defaultNamespace;
    }

    this.insert(namespace, module);
  }

  insert(namespace, module) {
    var qualifierName = namespace
      .concat(module.name)
      .join('.')
      .toLowerCase();

    module.__namespace = namespace;
    this.registry[qualifierName] = module;
  }

  find(qualifierName) {
    return this.registry[qualifierName];
  }
}

var moduleRegistry = new ModuleRegistry();