class Moduli {

  createModule(attachmentPoint, moduleClass) {
    var template = templateRegistry.find(moduleClass.getQualiferName());
    var module = this.constructModuleFromTemplate(template);

    attachmentPoint.appendChild(module.element);
  }

  constructModuleFromTemplate(template, parent){
    var children = template.children;
    var root = template.node;
    var ModuleConstructor =  moduleRegistry.registry[template.qualifierName];
    var module = null;

    if(templateRegistry.registry[template.qualifierName]) {
      root = document.createElement('div');
      root.classList = template.qualifierName
        .split('.')
        .reverse()
        .reduce((acc, _, index, children)=> {
          var classes = [];

          var list = [];
          for (var i = 0; i <= index; i++) {
            list.push(children[i]);
            classes.push(list.map((j)=>j));
          }

          acc.push(list.join('__'));
          return acc
        }, [])
        .join(' ');
    }

    if(ModuleConstructor){
      module = new ModuleConstructor();
      module.inject(root, parent);
    }

    children
      .map((child)=>{return {qualifierName: child.qualifierName, attributes: child.attributes, node:child.node.cloneNode(true), children: child.children};})
      .map((child)=>{
        var template = templateRegistry.registry[child.qualifierName];
        var passedOnNode = child;

        if(template) {
          template =  {qualifierName: template.qualifierName, attributes: child.attributes, node:template.node.cloneNode(true), children: template.children}
          if (child.children.length > 0) {
            var contentAttachment = template.children.filter((it)=>it.node.getAttribute('data-content') !== null)[0];

            if (!contentAttachment) {
              throw "No place to attach content";
            }

            contentAttachment.children = contentAttachment.children.concat(child.children);

            passedOnNode = template;
          } else {
            passedOnNode = template;
          }
        }

        return passedOnNode; })
      .map((child)=>this.constructModuleFromTemplate(child, module))
      .map((module)=>{
        return root.appendChild(module.element);
      });

    module && module.mounted();
    return module || {element:root};
  }
}