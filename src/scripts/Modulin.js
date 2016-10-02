var Modulin = (function () {


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
  }

  return Modulin;
})();