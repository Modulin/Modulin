(function() {
  Modulin.init('modulin');
  Modulin.init('modulin2');
  Modulin.init('modulin3');

  class TaskManager extends Module {
    constructor() {
      super();
      this.viewModel = new ViewModel({
        name: 'A name',
        list: []
      });
    }

    mounted() {
      console.log(this);
    }
  }

  Modulin.register(TaskManager);

  class Header extends Module {

    mounted() {
      this.attachListOf(Text, this.element, this.context.viewModel.getListenable('list'));
      this.context.viewModel.onChange('name', (it)=>this.update(it));
    }

    update(data) {
      this.element.querySelector('.header').innerHTML = data.name;
    }
  }

  Modulin.register(TaskManager, Header);


  class Text extends Module {
    mounted() {
      this.textElement = this.element.querySelector('.text');
      this.context.viewModel.onChange('name', (it)=>this.update(it));
    }

    update(data) {
      this.textElement.innerHTML = data.name;
    }
  }

  Modulin.register(Text);


  class VisibilityFilter extends Module {
    mounted() {
      var counter = 0;
      setInterval(()=> {
        this.context.viewModel.set('list', this.context.viewModel.get('list').concat({name: ++counter}));
      }, 100);
      setInterval(()=> {
        var list = this.context.viewModel.get('list');
        list.shift();
        this.context.viewModel.set('list', list);
      }, 200);
      setInterval(()=> {
        this.context.viewModel.set('name', Math.random());
      }, 500);
    }
  }


  Modulin.register(TaskManager, VisibilityFilter);

  class Connector extends Module { }

  Modulin.register(VisibilityFilter, Connector);

  class List extends Module { }

  Modulin.register(TaskManager, List);


  class CloseButton extends Module { }

  Modulin.register(CloseButton);
})();
