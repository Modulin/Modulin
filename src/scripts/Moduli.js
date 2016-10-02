class Moduli {

  static createModule(attachmentPoint, moduleClass, parent={}) {
    var template = templateRegistry
      .find(moduleClass
        .getQualiferName());

    var module = this
      .constructModuleFromTemplate(template, parent);

    attachmentPoint
      .appendChild(module.element);

    return module;}

  static generateClassListFrom(name){
    return name
      .split('.')
      .reverse()
      .reduce((acc, _, index, children)=> {
        var classes = [];

        var list = [];
        for (var i = 0; i <= index; i++) {
          list.push(children[i]);
          classes.push(list.map((j)=>j)); }

        acc.push(list.join('__'));
        return acc }, [])
      .join(' '); }

  static copyTemplate(template){
    return {
      qualifierName: template.qualifierName,
      attributes: template.attributes,
      node:template.node.cloneNode(true),
      children: template.children }; }

  static findContentNodeIn(root){
    return root.children
      .filter((it)=>it.node
        .getAttribute('data-content') !== null)[0]; }

  static useNodeTemplateIfExists(child){
    var template = templateRegistry.find(child.qualifierName);

    if(!template){
      return child; }

    template = this.copyTemplate(template);
    template.attributes = child.attributes;

    if(child.children.length === 0){
      return template; }

    var contentAttachment = this.findContentNodeIn(template);
    if (!contentAttachment) {
      throw "No place to attach content"; }

    contentAttachment.children = contentAttachment.children.concat(child.children);

    return template; }

  static createDomRootFromTemplate(template){
    var root = template.node;
    var registryTemplate = templateRegistry.find(template.qualifierName);

    if (registryTemplate) {
      root = document.createElement('div');
      root.classList = this
        .generateClassListFrom(
          template.qualifierName); }

    if (template.node.nodeName.indexOf('.') !== -1
      && !registryTemplate) {
      console.error(`No template found for ${template.qualifierName}. [Removing from DOM]`);
      root = null; }

    return root; }

  static createModuleBy(qualifierName){
    var module = null;
    var ModuleConstructor = moduleRegistry.find(qualifierName);
    if (ModuleConstructor){
      module = new ModuleConstructor(); }

    return module; }

  static createChildModules(module, children){
    return children
      .map((it)=>this.copyTemplate(it))
      .map((it)=>this.useNodeTemplateIfExists(it))
      .map((child)=>this.constructModuleFromTemplate(child, module)); }

  static attachChildModulesToRoot(root, childModules){
    if(root){
      childModules
        .filter((module)=>!!module.element)
        .forEach((module)=>root.appendChild(module.element)); } }

  static constructModuleFromTemplate(template, parent){
    var root = this.createDomRootFromTemplate(template);
    var module = this.createModuleBy(template.qualifierName);
    var childModules = this.createChildModules(module, template.children);

    if(module){
      module.inject(root, parent);}

    this.attachChildModulesToRoot(root, childModules);
    if(module){
      module.mounted();}

    return module || {element:root}; } }
