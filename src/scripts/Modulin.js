var Modulin = (function () {
  var namespacesToLoad = [];
  var timeOutHandle = null;

  function onLoaded() {
    namespacesToLoad.forEach((namespace)=>Modulin.registerTemplate(namespace));
    Modulin.mountToDom();
  }

  class Modulin {

    static createModule(mountPoint, moduleClass, parent = {}) {

      if(!mountPoint){
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
        return;
      }

      if(!moduleClass){
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
        return;
      }

      var template = templateRegistry
        .find(moduleClass
          .getQualiferName());

      if(!template){
        var qualifierName = moduleClass.getQualiferName();
        console.error(`No template found when attempting to create module

The requested template was:
  ${qualifierName}
  
The following action will be applied to resolve the issue: 
  Nothing will be created
  
Suggested solution which might solve the problem:
  Create a new template:
    <template id="${qualifierName}"></template>
`);
        return;
      }

      template = ModuleRenderer.copyTemplate(template);

      var properties = mountPoint.attributes['data-properties'];
      properties = properties ? properties.value
        .split(',')
        .map((it)=>it
          .split(':')
          .map((it)=>it.trim())
          .map((it)=>it.replace('"', '\\"'))
          .map((it)=>`"${it}"`)
          .join(': ')
        ).join(',') : '';

      template.attributes = JSON.parse(`{${properties}}`);
      var module = moduleRenderer.constructFromTemplate(template, parent);

      mountPoint.appendChild(module.element);

      return module;
    }

    static registerTemplate(template, namespace) {
      return templateRegistry.register(template, namespace);
    }

    static register(parentOrModule, module) {
      return moduleRegistry.register(parentOrModule, module);
    }

    static setDefaultNamespace(namespace) {
      moduleRegistry.defaultNamespace = [].concat(namespace);
    }

    static init(namespace){
      if(moduleRegistry.defaultNamespace.length === 0)
        Modulin.setDefaultNamespace(namespace);

      console.assert(namespace, "You must provide a namespace");
      namespacesToLoad.push([].concat(namespace));

      if (document.readyState === "complete") {
        clearTimeout(timeOutHandle);
        timeOutHandle = setTimeout(onLoaded,1);
      } else {
        window.removeEventListener('load', onLoaded);
        window.addEventListener('load', onLoaded);
      }
    }

    static mountToDom(){

      var rootModules = document.querySelectorAll('[data-module]');
      rootModules.forEach((element)=>{
        var qualifierName1 = element.getAttribute('data-module').toLowerCase();
        var qualifierName2 = null;
        var moduleClass = moduleRegistry.find(qualifierName1);
        if(!moduleClass){
          var qualifierName2 = moduleRegistry.defaultNamespace.concat(qualifierName1).join('.');
          moduleClass = moduleRegistry.find(qualifierName2);
        }
        if(!moduleClass){
          console.log(`No module found:

The tested qualifier names are:
  ${qualifierName1}
  ${qualifierName2}
  
The following action will be applied to resolve the issue: 
  A dummy module will be created for the template 
  
Suggested solution which might solve the problem:
  Create a new module:
    class AnExampleModule extends Module {}
    Modulin.register(AnExampleModule);
`);
          var qualifierName = qualifierName1.split('.');
          var name = qualifierName.pop();
          var parentName = qualifierName.pop();
          var namespace = qualifierName;
          var base = new Module();

          // moduleClass = new Function( `return function ${name}(){}` )();
          moduleClass = new Function( `return function ${name} () {
            this.inject = function ${base.inject.toString()}
            this.mounted = function ${base.mounted.toString()}
            }` )();
          moduleClass.getQualiferName = Module.getQualiferName;
          Modulin.register({__namespace: namespace, name:parentName}, moduleClass);
        }
        Modulin.createModule(element, moduleClass);
      });
    }
  }

  return Modulin;
})();