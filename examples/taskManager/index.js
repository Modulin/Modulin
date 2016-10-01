window.addEventListener('load', ()=> {
  templateRegistry.registerTemplate('Modulin');

  var moduli = new Moduli();
  moduli.createModule(document.getElementById('TaskManagerContainer'), TaskManager);
});