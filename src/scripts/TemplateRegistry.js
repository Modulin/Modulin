(function (exports) {

  class TemplateParser {
    constructor(templateElement, parentNamespace) {
      this.templateElement = templateElement;
      this.namespace = parentNamespace.concat(this.getId());
      this.node = this.getExpandedTemplate(['id', 'alias']);
      this.childNodes = this.getChildTemplateParsers();
      this.templateNode = TemplateNode.fromNode(this.node, this.namespace, this.templateElement.getAttribute('alias'));
    }

    getChildTemplateParsers() {
      return this.node.getElementsByTagName('template').map((child)=>new TemplateParser(child, this.namespace));
    }

    getId() {
      return this.templateElement.id.split('.');
    }

    getTemplateNodes() {
      return [].concat.apply(this.templateNode, this.childNodes.map((node)=>node.getTemplateNodes()));
    }

    getExpandedTemplate(excludedAttributes) {
      var expandedTemplate = document.createElement('div');
      expandedTemplate.innerHTML = this.templateElement.innerHTML;

      this.templateElement.attributes
        .filter((attr)=>excludedAttributes.indexOf(attr.name) === -1)
        .forEach((attr)=>
          expandedTemplate.setAttribute(attr.name, attr.value));

      return expandedTemplate;
    }
  }

  class NonTemplateNode {
    constructor(parameters) {
      this.qualifierName = parameters.qualifierName;
      this.node = parameters.node;
      this.children = parameters.children;

      this.attributes = parameters.attributes;
    }

    copy() {
      return new NonTemplateNode({
        qualifierName: this.qualifierName,
        node: this.node.cloneNode(true),
        children: this.children,

        attributes: this.attributes
      });
    }
  }
  NonTemplateNode.fromNode = function fromNode(node, namespace) {
    var qualifierName = parseQualifierName(node.nodeName, namespace);
    var attributes = parseAttributes(node.attributes);
    var children = node.children.map((child)=>NonTemplateNode.fromNode(child, namespace));

    return new NonTemplateNode({qualifierName, node, attributes, children});

    function parseQualifierName(name, namespace) {
      return []
        .concat([''], namespace, name)
        .join('.')
        .replace(/\.(.+)\..*\1/i, (_, $1)=>`.${$1}`)
        .substr(1)
        .toLowerCase();
    }

    function parseAttributes(attributeList) {
      return attributeList
        .map((attr)=> {
          return {
            key: attr.name.replace('data-', ''),
            value: attr.value
          }
        })
        .reduce(
          groupByField('key',
            mapKey('value')),
          into({}));

      function mapKey(key) {
        return function (obj) {
          return obj[key];
        }
      }

      function groupByField(key, valueMapper) {
        valueMapper = valueMapper || transparentMapper;
        return group;

        function group(obj, item) {
          obj[item[key]] = valueMapper(item);
          return obj;
        }

        function transparentMapper(value) {
          return value;
        }
      }

      function into(val) {
        return val;
      }
    }
  };

  class TemplateNode {
    constructor(parameters) {
      this.qualifierName = parameters.qualifierName;
      this.node = parameters.node;
      this.children = parameters.children;

      this.isNamespace = parameters.isNamespace;
      this.alias = parameters.alias;
    }

    copy() {
      return new TemplateNode({
        qualifierName: this.qualifierName,
        node: this.node.cloneNode(true),
        children: this.children,

        isNamespace: this.isNamespace,
        alias: this.alias,
      });
    }

  }
  TemplateNode.fromNode = function fromNode(node, namespace, alias) {
    var qualifierName = parseQualifierName(namespace);
    var isNamespace = getIsNamespace(node);
    var children = node.children.map((child)=>NonTemplateNode.fromNode(child, namespace));
    node = removeTags(node, 'template');

    return new TemplateNode({qualifierName, node, children, isNamespace, alias});

    function parseQualifierName(namespace){
      return namespace.join('.').toLowerCase();
    }

    function getIsNamespace(){
      return node.innerHTML.trim().length === 0;
    }

    function removeTags(node, nodeName) {
      node = node.cloneNode(true)
      nodeName = nodeName.toUpperCase();
      node.children
        .filter(
          (child)=>child.nodeName === nodeName)
        .forEach((child)=>node
          .removeChild(child));
      return node;
    }
  };

  class TemplateRegistry {

    constructor() {
      this.registry = {};
    }

    register(id, namespace = []) {
      var nodes = document.querySelectorAll(`#${id}`);
      flatten(nodes
        .map((node)=>new TemplateParser(node, namespace))
        .map((parser)=>parser.getTemplateNodes()))
        .forEach((template)=>this.registerParsedTemplate(template));

      function flatten(array) {
        return [].concat.apply([], array);
      }
    }

    registerParsedTemplate(template) {
      var qualifierName = template.qualifierName;
      var previousTemplate = this.registry[qualifierName];

      if (template.isNamespace && previousTemplate) {
        DuplicateTemplateDeclarationError(this.registry, template);
      } else {
        this.registry[qualifierName] = template;
      }
    }

    find(qualifierName) {
      return this.registry[qualifierName.toLowerCase()];
    }
  }

  function DuplicateTemplateDeclarationError(obj, template) {
    var suggestedNamespace = template['qualifierName'].split('.');
    suggestedNamespace.shift();
    suggestedNamespace.unshift('namespace2');
    suggestedNamespace = suggestedNamespace.join('.');

    console.error(`Duplicate template declarations:

The qualifier name which is duplicated is:
  ${template['qualifierName']}
  
The previous template with the qualifier name is:
  ${obj[template['qualifierName']].node.innerHTML.trim()}
  
The new template with the qualifier name is:
  ${template.node.innerHTML.trim()}
  
The following action will be applied to resolve the issue: 
  The new template will be ignored 
  
Suggested solution which might solve the problem:
  change the namespace of the a close button:
    <template id="${suggestedNamespace}"></template>
`);
  }

  exports.TemplateRegistry = new TemplateRegistry;
  exports.templateRegistry = new TemplateRegistry();
})(window);