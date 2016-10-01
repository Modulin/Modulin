class TemplateRegistry {

  constructor() {
    this.registry = {};
  }

  registerTemplate(id, namespace = []) {
    var node = document.getElementById(id);
    var templates = this.traverseTemplate(node, namespace);
    var resolvedTemplates = templates
      .map((template)=>this.resolveTemplate(template.value, template.key))
      .reduce((obj, template)=>{
        obj[template.qualifierName] = template;
        return obj; }, {});

    this.registry = resolvedTemplates;
  }

  traverseTemplate(node, parentNamespace) {
    var name = node.id.split('.');
    var expandedTemplate = this.expandTemplate(node);
    var childTemplates = this.findTagsInTemplate(node);
    var namespace = parentNamespace.concat(name);
    var qualifierName = namespace.join('.').toLowerCase();

    var templates = []
      .concat.apply([], childTemplates
        .map((template)=>this
          .traverseTemplate(template, namespace)));

    expandedTemplate.children
      .filter((child)=>child.nodeName === 'TEMPLATE')
      .map((child)=>expandedTemplate
        .removeChild(child));

    return templates
      .concat({key:qualifierName, value:expandedTemplate});
  }

  resolveTemplate(template, templateQualifierName) {
    var children = template.children
      .map((child)=>this
        .resolveFullQualifierName(templateQualifierName, child));

    return {qualifierName: templateQualifierName, node: template, children};
  }

  resolveFullQualifierName(templateQualifierName, node) {
    var qualifierName = `.${templateQualifierName}.${node.nodeName}`
      .toLowerCase()
      .replace(/\.(.+)\..*\1/, (_, $1)=>`.${$1}`)
      .substr(1);

    var children = node.children
      .map((child)=>this
        .resolveFullQualifierName(templateQualifierName, child));

    var attributes = node.attributes
      .filter((attr)=>attr.name
        .indexOf('data-') === 0)
      .map((attr)=>{return {key: attr.name.replace('data-',''), value: attr.value}})
      .reduce((obj, keyValue) => {
        obj[keyValue.key] = keyValue.value;
        return obj; }, {});

    return {qualifierName, node, children, attributes};
  }

  expandTemplate(template) {
    var expandedTemplate = document.createElement('div');
    expandedTemplate.innerHTML = template.innerHTML;
    return expandedTemplate;
  }

  findTagsInTemplate(template, tag = 'template') {
    return this
      .expandTemplate(template)
      .getElementsByTagName(tag);
  }

  find(qualifierName){
    return this.registry[qualifierName];
  }
}
var templateRegistry = new TemplateRegistry();