class TaskManager extends Module {
  constructor(){
    super();
    this.taskView = new ViewModel({
      name: 'A name'
    });
  }
}
moduleRegistry.register(TaskManager);

class Header extends Module {

  mounted(){
    this.updateTitle(this.context.taskView.get('name'));

    this.context.taskView.onChange((diff)=>{
      var name = diff['name'];
      if(name !== undefined){
        this.updateTitle(name);
      }
    })
  }

  updateTitle(title){
    this.element.querySelector('.header').innerHTML = title;
  }
}
moduleRegistry.register(TaskManager, Header);


class VisibilityFilter extends Module {
  mounted(){
    setInterval(()=>{
      this.context.taskView.set('name', Math.random());
    }, 1000);
  }
}
moduleRegistry.register(TaskManager, VisibilityFilter);

class Connector extends Module { }
moduleRegistry.register(VisibilityFilter, Connector);

class List extends Module { }
moduleRegistry.register(TaskManager, List);


class CloseButton extends Module { }
moduleRegistry.register(CloseButton);

