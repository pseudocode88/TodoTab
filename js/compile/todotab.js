'use strict';

var TodoStore = new Store('TodoTab');
var ActivityStore = new Store('Activity');

if (ActivityStore.get().length <= 0) {
		ActivityStore.addMultiple(Activities);
}

var Layout = React.createClass({
		render: function () {
				return React.createElement(Layout.Home, null);
		}
});

Layout.Home = React.createClass({
		getInitialState: function () {
				return {
						tasks: [],
						activities: []
				};
		},

		componentDidMount: function () {
				this.setState({
						tasks: TodoStore.get(),
						activities: ActivityStore.get()
				});
		},

		finishTask: function (id, done) {
				TodoStore.update(id, 'done', !done);
				this.setState({ tasks: TodoStore.get() });
		},

		addTask: function (task) {
				var matches = [];

				this.state.activities.forEach(function (activity) {
						var regex = new RegExp('\\b' + activity.name + '\\b', 'gi');

						if (task.match(regex)) {
								matches.push(activity);
						}
				});

				var todo = {
						id: Date.now(),
						task: task,
						tags: matches,
						done: false
				};

				TodoStore.add(todo);
				this.setState({ task: TodoStore.get() });
		},

		deleteTask: function (id) {
				TodoStore.delete(id);
				this.setState({ tasks: TodoStore.get() });
		},

		sortTodo: function () {
				var sorted = this.state.tasks.sort(function (x, y) {
						return y.id - x.id;
				});

				var unfinshed = sorted.filter(function (task) {
						return task.done === false;
				});

				var finshed = sorted.filter(function (task) {
						return task.done === true;
				});

				return unfinshed.concat(finshed);
		},

		render: function () {

				return React.createElement(
						'div',
						null,
						React.createElement(DateTime, null),
						React.createElement(AddTaskTextBox, {
								onEnter: this.addTask.bind(this) }),
						React.createElement(Todolist, {
								items: this.sortTodo(),
								onTaskCheck: this.finishTask,
								onTaskDelete: this.deleteTask }),
						React.createElement(Footer, null)
				);
		}
});

var DateTime = React.createClass({
		getInitialState: function () {
				return {
						date: moment().format('MMM Do, dddd'),
						time: moment().format('LT')
				};
		},

		componentDidMount: function () {
				setInterval(function () {
						this.setState({ time: moment().format('LT') });
				}.bind(this), 60);
		},

		render: function () {
				return React.createElement(
						'div',
						{ className: 'DateTime' },
						React.createElement(
								'span',
								{ className: 'DateTime__Date' },
								this.state.date
						),
						React.createElement(
								'span',
								{ className: 'DateTime__Time' },
								this.state.time
						)
				);
		}
});

var AddTaskTextBox = React.createClass({
		propTypes: {
				onEnter: React.PropTypes.func,
				value: React.PropTypes.string
		},

		getInitialState: function () {
				return { value: this.props.value };
		},

		getDefaultProps: function () {
				return {
						value: '',
						onEnter: function () {}
				};
		},

		handleKeyPress: function (e) {
				if (e.which === 13) {
						this.props.onEnter(e.target.value);
						this.setState({ value: '' });
				}
		},

		handleChange: function (e) {
				this.setState({ value: e.target.value });
		},

		render: function () {
				return React.createElement('input', { type: 'text',
						className: 'TextBox',
						placeholder: 'Add your tasks for the day\u2026',
						name: 'add-todo',
						value: this.state.value,
						onChange: this.handleChange.bind(this),
						onKeyPress: this.handleKeyPress.bind(this) });
		}
});

var Todolist = React.createClass({
		propTypes: {
				items: React.PropTypes.array,
				onTaskCheck: React.PropTypes.func,
				onTaskDelete: React.PropTypes.func
		},

		getDefaultProps: function () {
				return {
						items: []
				};
		},

		todolistItems: function () {
				if (this.props.items.length <= 0) {
						return React.createElement(Todolist.Empty, null);
				} else {
						return this.props.items.map(function (item) {
								return React.createElement(Todolist.Item, {
										id: item.id,
										task: item.task,
										done: item.done,
										tags: item.tags,
										onCheck: this.props.onTaskCheck,
										onDelete: this.props.onTaskDelete });
						}, this);
				}
		},

		render: function () {
				return React.createElement(
						'ul',
						{ className: 'Todolist', id: 'todos' },
						this.todolistItems()
				);
		}
});

Todolist.Item = React.createClass({
		propTypes: {
				id: React.PropTypes.string,
				task: React.PropTypes.string,
				done: React.PropTypes.bool,
				tags: React.PropTypes.array,
				onCheck: React.PropTypes.func,
				onDelete: React.PropTypes.func
		},

		createColourCoding: function (task, tags, done) {
				if (!done) {
						tags.forEach(function (tag) {
								task = task.replace(new RegExp('\\b' + tag.name + '\\b', 'gi'), '<span class="Color Color--' + tag.color + '">' + tag.name + '</span>');
						});
				}

				return { __html: task };
		},

		handleCheck: function () {
				this.props.onCheck(this.props.id, this.props.done);
		},

		handleDelete: function () {
				this.props.onDelete(this.props.id);
		},

		render: function () {
				var todoClasses = classNames({
						'Todo': true,
						'Todo--checked': this.props.done
				});

				return React.createElement(
						'li',
						{ className: todoClasses },
						React.createElement(
								'span',
								{ className: 'Todo__Check' },
								React.createElement('i', { onClick: this.handleCheck.bind(this) })
						),
						React.createElement('p', { className: 'Todo__Task',
								onClick: this.handleCheck.bind(this),
								dangerouslySetInnerHTML: this.createColourCoding(this.props.task, this.props.tags, this.props.done) }),
						React.createElement(
								'button',
								{ className: 'Todo__Delete', onClick: this.handleDelete.bind(this) },
								'\u2716'
						),
						React.createElement(
								'span',
								{ className: 'Todo__CreatedOn' },
								moment(this.props.id, 'x').fromNow()
						)
				);
		}
});

Todolist.Empty = React.createClass({
		render: function () {
				return React.createElement(
						'li',
						{ className: 'Empty' },
						React.createElement('img', { className: 'Empty__Buddha', src: 'images/buddha.png' }),
						'\u201CNo task remaining.',
						React.createElement('br', null),
						'Take a deep breath and enjoy the peace!\u201D'
				);
		}
});

var Footer = React.createClass({
		render: function () {
				return React.createElement(
						'footer',
						null,
						React.createElement('img', { className: 'Bird Bird--right', src: 'images/birds.png' }),
						React.createElement('img', { className: 'Bird Bird--middle', src: 'images/birds.png' }),
						React.createElement('img', { className: 'Bird Bird--left', src: 'images/birds.png' }),
						React.createElement('img', { className: 'Cloud Cloud--right', src: 'images/cloud-1.png' }),
						React.createElement('img', { className: 'Cloud Cloud--left', src: 'images/cloud-1.png' }),
						React.createElement(
								'p',
								{ className: 'Message' },
								React.createElement(
										'a',
										{ id: 'helplink', href: '#' },
										'Customize activities'
								),
								'\u2003\u2022\u2003',
								React.createElement(
										'a',
										{ id: 'helplink', href: '#' },
										'Help'
								)
						)
				);
		}
});

window.onload = function () {
		ReactDOM.render(React.createElement(Layout, null), document.getElementById('app'));
};
