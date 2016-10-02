window.addEventListener('load', ()=> {
  Modulin.registerTemplate('modulin');
  Modulin.createModule(document.getElementById('TaskManagerContainer'), TaskManager);
});
