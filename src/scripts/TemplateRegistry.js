function toKeyValue(mapper){
  return function(obj, item){
    mapper(obj, item);
    return obj; } }

function groupBy(key){
  return function(obj, item){
    obj[item[key]] = item; } }

function groupValueBy(key, valueKey){
  return function(obj, item){
    obj[item[key]] = item[valueKey]; } }

function into(val){
  return val; }

class TemplateRegistry {

  constructor() {
    this.registry = {};
  }

  registerTemplate(id, namespace = []) {
    var node = document
      .getElementById(id);

    var templates = this
      .traverseTemplate(node, namespace);

    var resolvedTemplates = templates
      .map((template)=>this
        .resolveTemplate(
          template.value,
          template.key));

    resolvedTemplates
      .reduce(
        toKeyValue(
          groupBy('qualifierName')),
      into(this.registry));
  }

  parseAttributes(attributes){
    return attributes
      .filter(
        (attr) =>attr.name .indexOf('data-') === 0)
      .map((attr)=>{return {
        key: attr.name.replace('data-',''),
        value: attr.value}})
      .reduce(
        toKeyValue(
          groupValueBy('key', 'value')), {});
  }

  removeTemplateTags(node){
    node.children
      .filter(
        (child)=>child.nodeName === 'TEMPLATE')
      .map((child)=>node
        .removeChild(child));
    return node;
  }

  traverseTemplate(node, parentNamespace) {
    var name = node.id.split('.');
    var childTemplates = this.findTagsInTemplate(node);
    var namespace = parentNamespace.concat(name);
    var qualifierName = namespace.join('.').toLowerCase();

    var expandedTemplate = this
      .removeTemplateTags(this
        .expandTemplate(node));

    var template = {
      key:qualifierName,
      value:expandedTemplate};

    return []
      .concat.apply([], childTemplates
        .map((itTemplate)=>this
          .traverseTemplate(itTemplate, namespace)))
      .concat(template);
  }

  resolveTemplate(template, templateQualifierName) {
    var children = template.children
      .map((child)=>this
        .resolveFullQualifierName(templateQualifierName, child));

    return {
      qualifierName: templateQualifierName,
      node: template, children};
  }

  resolveFullQualifierName(templateQualifierName, node) {
    var qualifierName = `.${templateQualifierName}.${node.nodeName}`
      .toLowerCase()
      .replace(/\.(.+)\..*\1/, (_, $1)=>`.${$1}`)
      .substr(1);

    var children = node.children
      .map((child)=>this
        .resolveFullQualifierName(templateQualifierName, child));

    var attributes = this
      .parseAttributes(node.attributes);

    return {
      qualifierName,
      node,
      children,
      attributes};
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