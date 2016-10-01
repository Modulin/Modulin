class Module {
  inject(element, context) {
    this.context = context;
    this.element = element;
  }

  static getQualiferName(){
    return this.__namespace.concat(this.name).join('.').toLowerCase();
  }

  mounted(){ }
}