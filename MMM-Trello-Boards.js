/* global Module */
/* Magic Mirror
 * Module: MM Habitica Todos
 *
 * By Mike Truax
 * MIT Licensed.
 */

Module.register("MMM-Trello-Boards", {

    // Default module config.
    defaults: {
        apiKey: null,
        token: null,
        overDueToTop: true, // DESC
        boardIDs: [],
        excludedListIDs: [],
        showChecklists: true
    },
    boards: [],
    // Define start sequence.
    start: function () {
        Log.info("Starting module:" + this.name);
        if (!this.config.apiKey || !this.config.token) {
            this.boards = [{text: "API Key and Token are required"}]
            return this.updateDom();
        }
        
        this.config.overDueToTop = this.config.overDueToTop || this.defaults.overDueToTop;
        this.config.showChecklists = this.config.showChecklists || this.defaults.showChecklists;
        this.config.excludedListIDs = this.config.excludedListIDs || this.defaults.defaults.excludedListIDs;
        this.boardIDs.forEach(id=> this.getBoards(id))
    },
    getStyles: function () {
        return ["MMM-Trello-Boards.css"];
    },
    // Override dom generator.
    getDom: function () {
        let wrapper = document.createElement("div");
        wrapper.classList.add("habitica-wrapper");
        let title = document.createElement("div");
        title.classList.add("habitica-title");
        title.innerText = "Habitica Todos";
        wrapper.appendChild(title);
        if(!this.todos){
            return wrapper;
        }
        let self = this;
        this.todos.forEach(todo=>{
            let todoCont = self.buildTodoEl("habitica-todo-container")
            todoCont.classList.add(this.getTodoClass(todo.value));
            let title = self.buildTodoEl("habitica-todo-title", todo.text);
            todoCont.appendChild(title);
            if(self.config.showDueDate){
                let formattedDate = self.formatTodoDate(todo.date)
                let date = self.buildTodoEl("habitica-todo-date", formattedDate)
                todoCont.appendChild(date);   
            }
            if(todo.notes && self.config.showNotes){
                let note = self.buildTodoEl("habitica-todo-note", todo.notes)
                todoCont.appendChild(note);
            }
            wrapper.appendChild(todoCont);
        })
        return wrapper;
    },
    buildBoard(elClass, text = ""){
        let el = document.createElement("div");
        el.innerText = text;
        el.classList.add(elClass);
        return el;
    },
    getBoards(id){
        fetch(`https://api.trello.com/1/boards/${id}?cards=all&checklists=all&fields=name&lists=open&key=${this.config.apiKey}&token=${this.config.token}`)
        .then(res => res.json())
        .then(board=>{
            
        })
    },
    getTodoClass(val){
        if(val >= 12) return "bright-blue";
        if(val >= 6) return "light-blue";
        if(val > 0) return "green";
        if(val == 0) return 'yellow';
        if(val > -9) return 'orange'
        if(val >= -16) return 'red';
        return 'dark-red'
    },
    formatTodoDate(date){
        let todoDate = new Date(date);
        let month = format(todoDate . getMonth() + 1);
        let day = format(todoDate . getDate());
        let year = format(todoDate . getFullYear());
        return month + "/" + day + "/" + year;
    }
});