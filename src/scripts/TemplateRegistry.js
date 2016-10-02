(function (exports) {
  function toKeyValue(mapper) {
    return function (obj, item) {
      mapper(obj, item);
      return obj;
    }
  }

  function groupValueBy(key, valueKey) {
    return function (obj, item) {
      obj[item[key]] = item[valueKey];
    }
  }

  function into(val) {
    return val;
  }

  function parseAttributes(attributes) {
    return attributes
      .map((attr)=> {
        return {
          key: attr.name.replace('data-', ''),
          value: attr.value
        }
      })
      .reduce(
        toKeyValue(
          groupValueBy('key', 'value')), {});
  }

  function removeTemplateTags(node) {
    node.children
      .filter(
        (child)=>child.nodeName === 'TEMPLATE')
      .map((child)=>node
        .removeChild(child));
    return node;
  }

  function expandTemplate(template) {
    var expandedTemplate = document.createElement('div');
    expandedTemplate.innerHTML = template.innerHTML;
    return expandedTemplate;
  }

  function findTagsInTemplate(template, tag = 'template') {
    return expandTemplate(template)
      .getElementsByTagName(tag);
  }

  function resolveFullQualifierName(templateQualifierName, node) {
    var qualifierName = `.${templateQualifierName}.${node.nodeName}`
      .toLowerCase()
      .replace(/\.(.+)\..*\1/, (_, $1)=>`.${$1}`)
      .substr(1);

    var children = node.children
      .map((child)=>resolveFullQualifierName(templateQualifierName, child));

    var attributes = parseAttributes(node.attributes);

    return {
      qualifierName,
      node,
      children,
      attributes
    };
  }

  function resolveTemplate(template, templateQualifierName) {
    var children = template.children
      .map((child)=>resolveFullQualifierName(templateQualifierName, child));

    return {
      qualifierName: templateQualifierName,
      node: template, children
    };
  }

  function traverseTemplate(node, parentNamespace) {
    var name = node.id.split('.');
    var childTemplates = findTagsInTemplate(node);
    var namespace = parentNamespace.concat(name);
    var qualifierName = namespace.join('.').toLowerCase();

    var expandedTemplate = removeTemplateTags(expandTemplate(node));

    var template = {
      key: qualifierName,
      value: expandedTemplate
    };

    return []
      .concat.apply([], childTemplates
        .map((itTemplate)=>
          traverseTemplate(itTemplate, namespace)))
      .concat(template);
  }

  class TemplateRegistry {

    constructor() {
      this.registry = {};
    }

    register(id, namespace = []) {
      var nodes = document
        .querySelectorAll(`#${id}`);

      nodes.forEach((node)=> {
        var templates =
          traverseTemplate(node, namespace);

        var resolvedTemplates = templates
          .map((template)=>resolveTemplate(
            template.value,
            template.key));

        resolvedTemplates
          .reduce((obj, template)=> {
              var templateContent = template.node.innerHTML.trim();
              if (templateContent) {
                if (obj[template['qualifierName']]) {
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
                  return obj;
                }
              }
              obj[template['qualifierName']] = template;
              return obj;
            },
            into(this.registry));
      });
    }

    find(qualifierName) {
      return this.registry[qualifierName];
    }
  }

  exports.TemplateRegistry = new TemplateRegistry;
  exports.templateRegistry = new TemplateRegistry();
})(window);