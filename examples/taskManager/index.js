window.addEventListener('load', ()=> {
  templateRegistry.registerTemplate('Modulin');

  Moduli.createModule(document.getElementById('TaskManagerContainer'), TaskManager); });
