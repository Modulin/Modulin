var Modulin = (function () {
  var namespacesToLoad = [];
  var timeOutHandle = null;

  function onLoaded() {
    namespacesToLoad.forEach((namespace)=>Modulin.registerTemplate(namespace));
    Modulin.mountToDom();
  }

  function parseProperties(rawProperties) {
    var properties = !rawProperties ? [] : rawProperties
      .split(',')
      .map((it)=>it
        .split(':')
        .map((it)=>it.trim())
        .map((it)=>it.replace('"', '\\"'))
        .map((it)=>`"${it}"`)
        .join(': ')
      ).join(',');

    return JSON.parse(`{${properties}}`);
  }

  class Modulin {

    static createModule(mountPoint, moduleClass, parent = {}) {

      if (!mountPoint) {
        NoMountPointProvided(moduleClass);
        return;
      }

      if (!moduleClass) {
        NoModuleClassProvided(mountPoint);
        return;
      }

      var qualifierName = moduleClass.getQualiferName();
      var originalTemplate = templateRegistry.find(qualifierName);
      if (!originalTemplate) {
        NoTemplateFoundForQualifier(qualifierName);
        return;
      }

      var template = originalTemplate.copy();
      template.attributes = parseProperties((mountPoint.attributes['data-properties'] || {}).value);

      var module = moduleRenderer.constructFromTemplate(template, parent);

      mountPoint.appendChild(module.element);

      return module;
    }

    static registerTemplate(template, namespace) {
      return templateRegistry.register(template, namespace);
    }

    static register(parentOrModule, moduleOrNull) {
      return moduleRegistry.register(parentOrModule, moduleOrNull);
    }

    static setDefaultNamespace(namespace) {
      moduleRegistry.defaultNamespace = [].concat(namespace);
    }

    static init(namespace) {
      if (moduleRegistry.defaultNamespace.length === 0)
        Modulin.setDefaultNamespace(namespace);

      console.assert(namespace, "You must provide a namespace");
      namespacesToLoad.push([].concat(namespace));

      if (document.readyState === "complete") {
        clearTimeout(timeOutHandle);
        timeOutHandle = setTimeout(onLoaded, 1);
      } else {
        window.removeEventListener('load', onLoaded);
        window.addEventListener('load', onLoaded);
      }
    }

    static mountToDom() {

      var rootModules = document.querySelectorAll('[data-module]');
      rootModules.forEach((element)=> {
        var qualifierName1 = element.getAttribute('data-module').toLowerCase();
        var qualifierName2 = null;
        var moduleClass = moduleRegistry.find(qualifierName1);

        if (!moduleClass) {
          qualifierName2 = moduleRegistry.defaultNamespace.concat(qualifierName1).join('.');
          moduleClass = moduleRegistry.find(qualifierName2);
        }

        if (!moduleClass) {
          var namespace = qualifierName1.split('.');
          if (!templateRegistry.find(qualifierName1)) {

            namespace = qualifierName2.split('.');
            if (!templateRegistry.find(qualifierName2)) {
              console.error('-------------------');
              return;
            }
          }

          var name = namespace.pop();
          var parentName = namespace.pop();
          var parent = {__namespace: namespace, name: parentName};

          if (!parentName) {
            console.log('A namespace is required to create a module');
            return;
          }

          moduleClass = Module.createSubClass(name);
          Modulin.register(parent, moduleClass);
          NoModuleFound([qualifierName1, qualifierName2], namespace);
        }

        Modulin.createModule(element, moduleClass);
      });
    }
  }

  return Modulin;

  function NoModuleFound(qualifierNames, namespace){
    var fullNamespace = namespace.join('.');

    console.log(`No module found:

The tested qualifier names are:
  ${qualifierNames.join('\n  ')}
  
The following action will be applied to resolve the issue: 
  A dummy module will be created for the template:
   ${fullNamespace}
`);
  }

  function NoTemplateFoundForQualifier(qualifierName) {
    console.error(`No template found when attempting to create module

The requested template was:
  ${qualifierName}
  
The following action will be applied to resolve the issue: 
  Nothing will be created
  
Suggested solution which might solve the problem:
  Create a new template:
    <template id="${qualifierName}"></template>
`);
  }

  function NoModuleClassProvided(mountPoint) {
    var mountPointElement = mountPoint.outerHTML.replace(mountPoint.innerHTML, '');
    console.error(`No module class provided when attempting to create module

The module was requested to be mounted at:
  ${mountPointElement}
  
The following action will be applied to resolve the issue: 
  Nothing will be created
  
Suggested solution which might solve the problem:
  Create a new module:
    class AnExampleModule extends Module {}
`);
  }

  function NoMountPointProvided(moduleClass) {
    console.error(`No mount point provided when attempting to create module

The module which was requested to be constructed:
  ${moduleClass.name}
  
The following action will be applied to resolve the issue: 
  ${moduleClass.name} will not be created
  
Suggested solution which might solve the problem:
  Add a node to the dom:
    <div id="${moduleClass.name}Container"></div>
    
  AND try creating the module:
    Modulin.createModule(document.getElementById("${moduleClass.name}Container"), ${moduleClass.name});

`);
  }
})();