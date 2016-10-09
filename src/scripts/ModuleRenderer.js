(function (exports) {

  function aliasMutator(parameters) {
    var template = parameters.template;
    var aliasedTemplate = template.getAliasTemplate();

    if (aliasedTemplate) {
      aliasedTemplate = aliasedTemplate.copy();
      aliasedTemplate.qualifierName = template.qualifierName;
      template = aliasedTemplate;
    }

    return template;
  }

  function attributeMutator(parameters) {
    var node = parameters.node;
    var template = parameters.template;

    template.attributes = node.attributes;
    return template;
  }

  function contentAttachmentMutator(parameters) {
    var node = parameters.node;
    var template = parameters.template;

    if (node.children.length === 0) {
      return template;
    }

    var contentAttachment = findContentNodeInTemplate(template);
    if (!contentAttachment) {
      MissingElementContentMountPoint(template, node);
      return template;
    }

    contentAttachment.children = contentAttachment.children.concat(node.children);
    return template;

    function findContentNodeInTemplate(template) {
      return template.children
        .filter((it)=>it.node
          .getAttribute('content') !== null)[0];
    }
  }


  var templateMutators = [];

  templateMutators.push(aliasMutator);
  templateMutators.push(attributeMutator);
  templateMutators.push(contentAttachmentMutator);

  class Attribute {
    constructor(key, value) {
      this.key = key;
      this.value = value;
    }

    writeTo(node) {
      if (this.value || node.getAttribute(this.key)) {
        node.setAttribute(this.key, this.value)
      }
    }
  }

  class ClassAttribute {
    constructor(template, options) {
      var separator = options.moduleClassSeparator;
      var expandedQualfierName = template.qualifierName.split('.');

      if (options.excludeNamespace) {
        expandedQualfierName.shift();
      }

      this.value = expandedQualfierName
        .reverse()
        .reduce((acc, _, index, children)=> {
          var classes = [];

          var list = [];
          for (var i = 0; i <= index; i++) {
            list.push(children[i]);
            classes.push(list.map((j)=>j));
          }

          acc.push(list.join(separator));
          return acc
        }, []);
    }

    writeTo(node) {
      node.classList = this.value.join(' ');
    }
  }

  class ModuleConstructor {
    constructor(options, node, parentModule) {
      this.options = options;
      this.parent = parentModule;

      this.template = node.isTemplate ? node : node.getTemplate();
      this.templateChild = this.template ? null : node.copy();
    }

    getQualifierName() {
      return this.getTemplateLike().qualifierName;
    }

    getTemplateLike() {
      return (this.template || this.templateChild);
    }


    attachChildModulesToDomNode(childModules, domNode) {
      childModules.filter((module)=>!!module.element).forEach((module)=>domNode.appendChild(module.element));
    }

    mountModule(module, node, childModules) {
      var properties = this.getTemplateLike().attributes;
      var parent = this.parent;

      if (node) {
        this.attachChildModulesToDomNode(childModules, node);
      }

      if (module) {
        module.mount(node, parent, properties);
        module.mounted();
      }

      return module || {element: node};
    }

    constructChild(node, module) {
      var template = node.getTemplate();

      if (template) {
        template = templateMutators.reduce((template, resolver)=>resolver({node, template}), template.copy());
      } else {
        template = node.copy();
      }

      return new ModuleConstructor(this.options, template, module).constructAndMount();
    }

    constructChildModules(module) {
      return this.getTemplateLike().children.map((child)=>this.constructChild(child, module));
    }

    constructDomNode() {
      if (this.template) {
        var domNode = document.createElement('div');

        [new ClassAttribute(this.template, this.options),
         new Attribute('instance', this.template.attributes.instance)
        ].forEach((attr)=>attr.writeTo(domNode));

        return domNode;
      } else {

        if (this.templateChild.node.nodeName.indexOf('.') !== -1) {
          NoTemplateFound(this.templateChild);
        }

        return this.templateChild.node;
      }
    }

    constructModule() {
      var qualifierName = this.getQualifierName();
      var Module = moduleRegistry.find(qualifierName);

      return Module ? new Module() : null;
    }

    constructAndMount() {
      var module = this.constructModule();
      var domNode = this.constructDomNode();
      var childModules = this.constructChildModules(module);

      return this.mountModule(module, domNode, childModules);
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
      var constructor = new ModuleConstructor(this.options, template, parent);
      return constructor.constructAndMount();
    }
  }

  exports.ModuleRenderer = ModuleRenderer;
  exports.moduleRenderer = new ModuleRenderer();

  function NoTemplateFound(template) {
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

  function MissingElementContentMountPoint(template, child) {
    console.error(`Missing element content mount point in template when attempting to attach inline children

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