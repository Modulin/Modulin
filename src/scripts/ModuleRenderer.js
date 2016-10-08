(function (exports) {

  const Resolvers = {
    alias: function aliasResolver(node, template) {
      var aliasedTemplate = template.getAliasTemplate();

      if (aliasedTemplate) {
        aliasedTemplate = aliasedTemplate.copy();
        aliasedTemplate.qualifierName = template.qualifierName;
        template = aliasedTemplate;
      } else {
        template = template.copy();
      }

      return template;
    },
    attribute: function attributeResolver(node, template) {
      template.attributes = node.attributes;
      return template;
    },
    contentAttachment: function contentAttachmentResolver(node, template) {
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
  };


  class Attribute {
    constructor(key, value) {
      this.key = key;
      this.value = value;
    }

    writeTo(node){
      node.setAttribute(this.key, this.value)
    }
  }

  class ClassAttribute {
    constructor(template, options){
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

    writeTo(node){
      node.classList = this.value.join(' ');
    }
  }


  class ModuleConstructor {
    constructor(options, template, parentModule) {
      this.options = options;

      this.template = template;
      this.parent = parentModule;
    }

    mountModule(module, node, children){
      var properties = this.template.attributes;
      var parent = this.parent;

      if (node) {
        children.filter((module)=>!!module.element).forEach((module)=>node.appendChild(module.element));
      }

      if (module) {
        module.mount(node, parent, properties);
        module.mounted();
      }

      return module || {element: node};
    }

    constructChildren(node, module) {
      var template = node.getTemplate();

      if (template) {
        template = Resolvers.alias(node, template);
        template = Resolvers.attribute(node, template);
        template = Resolvers.contentAttachment(node, template);
      } else {
        template = node.copy();
      }

      return new ModuleConstructor(this.options, template, module).constructAndMount();
    }

    constructRootNode() {
      var node = this.template.node;
      var registryTemplate = templateRegistry.find(this.template.qualifierName);

      if (registryTemplate) {

        var attributeList = [];
        attributeList.push(new ClassAttribute(this.template, this.options));
        if (this.template.attributes.instance) {
          attributeList.push(new Attribute('instance', this.template.attributes.instance));
        }

        node = document.createElement('div');
        attributeList.forEach((attr) =>attr.writeTo(node));
      }

      if (this.template.node.nodeName.indexOf('.') !== -1 && !registryTemplate) {
        NoTemplateFound(this.template);
      }

      return node;
    }

    constructoModule() {
      var qualifierName = this.template.qualifierName;
      var Module = moduleRegistry.find(qualifierName);
      if (Module) {
        return new Module();
      }
    }

    constructAndMount() {
      var module = this.constructoModule();
      var node = this.constructRootNode();
      var childModules = this.template.children.map((child)=>this.constructChildren(child, module));

      return this.mountModule(module, node, childModules);
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
      return new ModuleConstructor(this.options, template, parent).constructAndMount();
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