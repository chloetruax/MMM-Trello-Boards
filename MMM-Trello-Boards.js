const moment = require("moment");

/* global Module */
/* Magic Mirror
 * Module: MM Trello Boards
 *
 * By Mike Truax
 * MIT Licensed.
 */

Module.register("MMM-Trello-Boards", {

    // Default module config.
    defaults: {
        apiKey: null,
        token: null,
        sortByDueDate: true, // DESC
        boardIDs: [],
        showDueDate: true,
        excludedListIDs: [],
        showChecklists: true,
        allowScrolling: true,
        scrollSpeed: 30
    },
    boards: [],
    // Define start sequence.
    start: function () {
        Log.info("Starting module:" + this.name);
        if (!this.config.apiKey || !this.config.token) {
            this.boards = [{ name: "API Key and Token are required", lists: []}]
            return this.updateDom();
        }
        this.setDefaults();
        
        this.boardIDs.forEach(id => this.getBoards(id))
    },
    getStyles: function () {
        return ["MMM-Trello-Boards.css"];
    },
    // Override dom generator.
    getDom: function () {
        let wrapper = document.createElement("div");
        wrapper.classList.add("trello-wrapper");
        
        this.boards.forEach( board =>{
            this.buildBoard(board)
        })
        
        let title = document.createElement("div");
        title.classList.add("habitica-title");
        title.innerText = "Habitica Todos";
        wrapper.appendChild(title);
        if (!this.todos) {
            return wrapper;
        }
        let self = this;
        this.todos.forEach(todo => {
            let todoCont = self.buildTodoEl("habitica-todo-container")
            todoCont.classList.add(this.getTodoClass(todo.value));
            let title = self.buildTodoEl("habitica-todo-title", todo.text);
            todoCont.appendChild(title);
            if (self.config.showDueDate) {
                let formattedDate = self.formatTodoDate(todo.date)
                let date = self.buildTodoEl("habitica-todo-date", formattedDate)
                todoCont.appendChild(date);
            }
            if (todo.notes && self.config.showNotes) {
                let note = self.buildTodoEl("habitica-todo-note", todo.notes)
                todoCont.appendChild(note);
            }
            wrapper.appendChild(todoCont);
        })
        return wrapper;
    },
    setDefaults(){
        this.config.scrollSpeed = this.config.scrollSpeed || this.defaults.scrollSpeed;
        this.config.allowScrolling = this.config.allowScrolling || this.defaults.allowScrolling;
        this.config.sortByDueDate = this.config.sortByDueDate || this.defaults.sortByDueDate;
        this.config.showDueDate = this.config.showDueDate || this.defaults.showDueDate;
        this.config.showDueDate = this.config.showDueDate || this.defaults.showDueDate;
        this.config.showChecklists = this.config.showChecklists || this.defaults.showChecklists;
        this.config.excludedListIDs = this.config.excludedListIDs || this.defaults.defaults.excludedListIDs;
    },
    buildBoard(elClass, text = "") {
        let el = document.createElement("div");
        let header = document.createElement("h2")
        el.innerText = text;
        el.classList.add(elClass);
        return el;
    },
    getBoards(id) {
        let self = this
        fetch(`https://api.trello.com/1/boards/${id}?cards=all&checklists=all&fields=name&lists=open&key=${this.config.apiKey}&token=${this.config.token}`)
            .then(res => res.json())
            .then(board => {
                self.formatBoardObject(board);
            })
    },
    formatBoardObject(board) {
        // starts up board info with minimal data
        let newBoard = { name: board.name };
        let self = this;
        // loops through the cards and organizes them into objects based off the list. 
        // This will help reduce the need to filter cards multiple times for lists later
        // This also pushes the needed checklists into the cards if they're needed

        let groupedCards = board.cards;
        if(this.config.sortByDueDate){
            groupedCards = groupedCards.sort((a,b) => {
                if(a.due == null){
                return 1
                }
                if(b.due == null){
                return -1
                }
                return a.due - b.due
              })
        }
        
        groupedCards = groupedCards.reduce((acc, current) => {
            if (!self.config.excludedListIDs.includes(current.idList)) {
                let trimmed = self.trimCard(current)
                if (self.config.showChecklists && current.idChecklists.length > 0) {
                    let checkLists = board.checklists.filter(cl => cl.idCard === current.id);
                    trimmed.checkLists = self.trimChecklist(checkLists);
                }
                if (acc[`_${trimmed.idList}`]) {
                    acc[`_${trimmed.idList}`].push(trimmed)
                }
                else {
                    acc[`_${trimmed.idList}`] = [trimmed]
                }
            }
            return acc
        }, {});
        let lists = board.lists.filter(l => !self.config.excludedListIDs.includes(l.id));
        
        lists = lists.map(list=> {
            return {
                name: list.name,
                cards: groupedCards[`_${list.id}`]
            }
        })

        newBoard.lists = lists;
        this.boards.push(newBoard);
        this.updateDom();
    },
    trimChecklist(list) {
        let lists = list.map(l =>
            {
               return  {
                name: l.name,
                items: l.checkItems.map(item => {
                    return {
                        name: item.name,
                        state: item.state
                    }
                })
            }
        })
        return lists;
    },
    // Strips out only the needed pieces of the cards, mostly used to rename some keys and move everything to the top level
    trimCard(card) {
        let self = this;
        return {
            id: card.id,
            name: card.name,
            idList: card.idList,
            due: self.formatDate(card.due),
            idChecklists: card.idChecklists,
            itemsToCheck: card.checkItems,
            itemsChecked: card.checkItemsChecked
        }
    },

    // Utilizes moment.js to allow for easier string building of due dates
    formatDate(date) {
        let dateObj = new Date(date)
        return moment(dateObj).format('MMM Do YYYY')
    }
});