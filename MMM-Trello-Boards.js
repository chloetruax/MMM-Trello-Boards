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
            this.boards = [{ text: "API Key and Token are required" }]
            return this.updateDom();
        }

        this.config.overDueToTop = this.config.overDueToTop || this.defaults.overDueToTop;
        this.config.showChecklists = this.config.showChecklists || this.defaults.showChecklists;
        this.config.excludedListIDs = this.config.excludedListIDs || this.defaults.defaults.excludedListIDs;
        this.boardIDs.forEach(id => this.getBoards(id))
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
    buildBoard(elClass, text = "") {
        let el = document.createElement("div");
        el.innerText = text;
        el.classList.add(elClass);
        return el;
    },
    getBoards(id) {
        fetch(`https://api.trello.com/1/boards/${id}?cards=all&checklists=all&fields=name&lists=open&key=${this.config.apiKey}&token=${this.config.token}`)
            .then(res => res.json())
            .then(board => {
                this.formatBoardObject(board);
            })
    },
    formatBoardObject(board) {
        // starts up board info with minimal data
        let newBoard = { name: board.name };

        // loops through the cards and organizes them into objects based off the list. 
        // This will help reduce the need to filter cards multiple times for lists later
        // This also pushes the needed checklists into the cards if they're needed

        let groupedCards = board.cards.reduce((acc, current) => {
            if (!this.config.excludedListIDs.includes(current.idList)) {
                let trimmed = this.trimCard(current)
                if (this.config.showChecklists && current.idChecklists.length > 0) {
                    let checkLists = board.checklists.filter(cl => cl.idCard === current.id);
                    trimmed.checkLists = this.trimChecklist(checkLists);
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
        let lists = board.lists.filter(l => !this.config.excludedListIDs.includes(l.id));
        
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
        return {
            id: card.id,
            name: card.name,
            idList: card.idList,
            due: card.due,
            idChecklists: card.idChecklists,
            itemsToCheck: card.checkItems,
            itemsChecked: card.checkItemsChecked
        }
    },
    getTodoClass(val) {
        if (val >= 12) return "bright-blue";
        if (val >= 6) return "light-blue";
        if (val > 0) return "green";
        if (val == 0) return 'yellow';
        if (val > -9) return 'orange'
        if (val >= -16) return 'red';
        return 'dark-red'
    },
    formatTodoDate(date) {
        let todoDate = new Date(date);
        let month = format(todoDate.getMonth() + 1);
        let day = format(todoDate.getDate());
        let year = format(todoDate.getFullYear());
        return month + "/" + day + "/" + year;
    }
});