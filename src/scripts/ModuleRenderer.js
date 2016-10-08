(function (exports) {

  function findContentNodeInTemplate(template) {
    return template.children
      .filter((it)=>it.node
        .getAttribute('content') !== null)[0];
  }

  function useNodeTemplateIfExists(child, parentDebugContext) {
    var template = templateRegistry.find(child.qualifierName);

    if (!template) {
      return child;
    }

    var alias = template.alias;
    if (alias) {
      var aliasedTemplate = templateRegistry.find(alias);
      aliasedTemplate = aliasedTemplate.copy();
      aliasedTemplate.qualifierName = template.qualifierName;
      template = aliasedTemplate;
    } else {
      template = template.copy();
    }

    template.attributes = child.attributes;

    if (child.children.length === 0) {
      return template;
    }

    var contentAttachment = findContentNodeInTemplate(template);
    if (!contentAttachment) {
      MissingElementContentMountPoint(template, child, parentDebugContext);
      return template;
    }

    contentAttachment.children = contentAttachment.children.concat(child.children);
    return template;
  }

  function createDomRootFromTemplate(template, options) {
    var root = template.node;
    var registryTemplate = templateRegistry.find(template.qualifierName);

    if (registryTemplate) {
      root = document.createElement('div');
      root.classList = generateClassListFromTemplate(template, options);

      if (template.attributes.instance) {
        root.setAttribute('data-instance', template.attributes.instance);
      }
    }

    if (template.node.nodeName.indexOf('.') !== -1 && !registryTemplate) {
      NoTemplateFound(template);
      root = null;
    }

    return root;
  }

  function generateClassListFromTemplate(template, options) {
    var expandedQualfierName = template.qualifierName.split('.');

    if (options.excludeNamespace) {
      expandedQualfierName.shift();
    }

    return expandedQualfierName
      .reverse()
      .reduce((acc, _, index, children)=> {
        var classes = [];

        var list = [];
        for (var i = 0; i <= index; i++) {
          list.push(children[i]);
          classes.push(list.map((j)=>j));
        }

        acc.push(list.join(options.moduleClassSeparator));
        return acc
      }, [])
      .join(' ');
  }

  function createModuleBy(qualifierName) {
    var module = null;
    var ModuleConstructor = moduleRegistry.find(qualifierName);
    if (ModuleConstructor) {
      module = new ModuleConstructor();
    }

    return module;
  }

  function constructModuleFromTemplate(template, parent, options) {
    var root = createDomRootFromTemplate(template, options);
    var module = createModuleBy(template.qualifierName);
    var childModules = createChildModules(module, template.children, template, options);

    if (module) {
      module.mount(root, parent, template.attributes);
    }

    attachChildModulesToRoot(root, childModules);
    if (module) {
      module.mounted();
    }

    return module || {element: root};
  }

  function createChildModules(module, children, parentDebugContext, options) {

    return children
      .map((child)=>child.copy())
      .map((child)=>useNodeTemplateIfExists(child, parentDebugContext))
      .map((child)=>constructModuleFromTemplate(child, module, options));
  }

  function attachChildModulesToRoot(root, childModules) {
    if (root) {
      childModules
        .filter((module)=>!!module.element)
        .forEach((module)=>root.appendChild(module.element));
    }
  }

  class ModuleRenderer {

    constructor() {
      this.options = {
        excludeNamespace: true,
        moduleClassSeparator: '__'
      };
    }

    constructFromTemplate(template, parent) {
      var options = this.options;
      return constructModuleFromTemplate(template, parent, options);
    }
  }

  exports.ModuleRenderer = ModuleRenderer;
  exports.moduleRenderer = new ModuleRenderer();

  function NoTemplateFound(template){
    console.error(`No template found

The module which is used improperly has qualifier name:
  ${template.qualifierName}

The following action will be applied to resolve the issue: 
  Template will not be rendered (Javascript modules will still be created)

Suggested solution which might solve the problem:
  Add the template:
[   <template id=${template.qualifierName}></template>   ]
`);
  }

  function MissingElementContentMountPoint(template, child, parentDebugContext) {
    console.error(`Missing element content mount point in template when attempting to attach inline children

The parent which is being constructed has the qualifier name:
  ${parentDebugContext.qualifierName}

The module which is used improperly has qualifier name:
  ${template.qualifierName}
    
The affected children are:
    ${child.node.innerHTML.trim()}
        
In the template when used in the following way:
    ${child.node.outerHTML.trim()}
    
The following action will be applied to resolve the issue: 
  Inline children will be removed 

Suggested solution which might solve the problem:
  Add a DIV element with a content attribute:
    ${template.node.innerHTML.trim()}
[   <div content></div>                                  ]
`);
  }

})(window);