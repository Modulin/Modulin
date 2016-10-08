(function () {
  Modulin.init('Modulin');


  class TodoItemViewModel extends ViewModel {
    constructor(text, checked = false) {
      super({text, checked});
    }
  }

  class Todo extends Module {
    constructor() {
      super();
      this.viewModel = new ViewModel({
        title: 'My fantastic Todo List',
        items: [
          new TodoItemViewModel('one'),
          new TodoItemViewModel('two'),
          new TodoItemViewModel('three', true, false),
        ]
      });
    }
  }
  Modulin.register(Todo);

  class List extends Module {
    mounted() {
      this.attachListOf(Item, this.element, this.context.viewModel.getListenable('items'));
    }
  }
  Modulin.register(Todo, List);

  class ClearCompleted extends Module {
    mounted() {
      this.element.querySelector('.content').innerHTML = 'Clear';
      this.element
        .addEventListener('click', ()=> {
          var items = this.context.viewModel.get('items');
          items = items.filter((item)=>!item.get('checked'));
          this.context.viewModel.set('items', items);
        });
    }
  }
  Modulin.register(Todo, ClearCompleted);

  class Header extends Module {
    mounted() {
      this.textElement = this.element.querySelector('.title');
      this.context.viewModel.onChange('title', (it)=>this.update(it));
    }

    update(data) {
      this.textElement.innerHTML = data.title;
    }
  }
  Modulin.register(Todo, Header);

  class AddField extends Module {
    mounted() {
      this.inputElement = this.element.querySelector('input');
      this.inputElement
        .addEventListener('keypress', (e)=> {
          if(e.keyCode === 13) {
            var value = this.inputElement.value;
            this.inputElement.value = '';

            var items = this.context.viewModel.get('items');
            items.push(new TodoItemViewModel(value));
            this.context.viewModel.set('items', items);
          }
        });
    }
  }
  Modulin.register(Todo, AddField);

  class Item extends Module {
    mounted() {
      this.textElement = this.element.querySelector('span');
      this.checkboxElement = this.element.querySelector('input');

      this.checkboxElement.addEventListener('change', ()=> {
        this.context.viewModel.set('checked', !!this.checkboxElement.checked);
      });
    }

    update(data) {
      var key = Object.keys(data)[0];
      switch (key) {
        case 'text':
          this.textElement.innerHTML = data.text;
          break;
        case 'checked':
          this.checkboxElement.checked = !!data.checked;
          break;
      }
    }
  }
  Modulin.register(List, Item);

})();
