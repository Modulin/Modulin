(function(){
  var arrayMethods = Object.getOwnPropertyNames(Array.prototype);

  [NodeList, HTMLCollection, NamedNodeMap].forEach(addArrayMethods);

  function addArrayMethods(object) {
    arrayMethods.forEach(attachArrayMethodsToNodeList.bind(object)); }

  function attachArrayMethodsToNodeList(methodName) {
    if (methodName !== "length" && !this.prototype[methodName]) {
      Object.defineProperty(this.prototype, methodName, {
        enumerable: false,
        configurable: false,
        writable: false,
        value: Array.prototype[methodName] }); } } })();