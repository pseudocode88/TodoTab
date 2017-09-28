'use strict';

var TodoStore = new Store('TodoTab-Tasks');
var ActivityStore = new Store('TodoTab-Activities');

var Layout = React.createClass({

	layouts: [{ name: 'Back to Todo', link: 'home' }, { name: 'Customize Activities', link: 'customize' }, { name: 'Help', link: 'help' }],

	getInitialState: function () {
		return { layout: 'home' };
	},

	goto: function (link) {
		this.setState({ layout: link });
	},

	render: function () {
		var content = [];

		switch (this.state.layout) {
			case 'home':
				content.push(React.createElement(Layout.Home, null));
				break;
			case 'customize':
				content.push(React.createElement(Layout.Customize, null));
				break;
			case 'help':
				content.push(React.createElement(Layout.Help, null));
				break;
		}

		content.push(React.createElement(Footer, {
			layout: this.state.layout,
			layouts: this.layouts,
			goto: this.goto.bind(this) }));
		return React.createElement(
			'div',
			null,
			content
		);
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
				matches.push(activity.id);
			}
		});

		var todo = {
			id: uuid(),
			createdOn: Date.now(),
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
			return y.createdOn - x.createdOn;
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
			React.createElement(TextBox, {
				placeholder: 'Add your tasks for the day\u2026',
				onEnter: this.addTask.bind(this) }),
			React.createElement(Todolist, {
				items: this.sortTodo(),
				activities: this.state.activities,
				onTaskCheck: this.finishTask,
				onTaskDelete: this.deleteTask })
		);
	}
});

Layout.Customize = React.createClass({

	getInitialState: function () {
		return {
			activities: []
		};
	},

	componentDidMount: function () {
		this.setState({ activities: ActivityStore.get() });
	},

	addActivity: function (name) {
		var activity = {
			id: uuid(),
			name: name,
			color: 'default'
		};

		ActivityStore.add(activity);
		this.setState({ activities: ActivityStore.get() });

		var tasks = TodoStore.get(),
		    regex = '';

		tasks.forEach(function (task) {

			regex = new RegExp('\\b' + name + '\\b', 'gi');

			if (task.task.match(regex)) {
				task.tags.push(activity.id);
				TodoStore.update(task.id, 'tags', task.tags);
			}
		});
	},

	deleteActivity: function (id) {
		ActivityStore.delete(id);
		this.setState({ activities: ActivityStore.get() });

		var tasks = TodoStore.get(),
		    found = -1,
		    tags = [];

		tasks.forEach(function (task) {
			tags = task.tags;
			found = tags.indexOf(id);
			if (found >= 0) {
				tags.splice(found, 1);
				TodoStore.update(task.id, 'tags', tags);
			}
		});
	},

	updateActivityColor: function (id, color) {
		ActivityStore.update(id, 'color', color);
		this.setState({ activities: ActivityStore.get() });
	},

	render: function () {
		return React.createElement(
			'div',
			null,
			React.createElement(
				'div',
				{ className: 'CustomizeHeder' },
				React.createElement(
					'h1',
					null,
					'Customize Activities'
				),
				React.createElement(
					'p',
					null,
					'Expand your activity list by adding and managing new tags.'
				)
			),
			React.createElement(TextBox, {
				placeholder: 'Add a custom activity. eg. project, project/todo',
				onEnter: this.addActivity.bind(this) }),
			React.createElement(Activitylist, { items: this.state.activities,
				onColorChange: this.updateActivityColor,
				onDeleteActivity: this.deleteActivity })
		);
	}
});

Layout.Help = React.createClass({
	render: function () {
		return React.createElement(
			'div',
			null,
			React.createElement(
				'div',
				{ className: 'Help__Section' },
				React.createElement('img', { src: 'images/icon128.png', className: 'Logo' }),
				React.createElement(
					'h1',
					null,
					'Todo Tab'
				),
				React.createElement(
					'p',
					null,
					'A simple to-do list for those who spend most of the day in front of the browser. No login, no big background image, just a simple Todo list. - version 1.0.0'
				)
			),
			React.createElement(
				'div',
				{ className: 'Break' },
				'* \u2003 * \u2003 *'
			),
			React.createElement(
				'div',
				{ className: 'Features' },
				React.createElement(
					'blockquote',
					null,
					'\u201CIdentify your tasks faster',
					React.createElement('br', null),
					'through activity based color coding\u201D'
				),
				React.createElement(
					'div',
					{ className: 'ColorCodes' },
					React.createElement('img', { className: 'ColorCodesImage', src: 'images/color-1.png' }),
					React.createElement('img', { className: 'ColorCodesImage', src: 'images/color-4.png' }),
					React.createElement('img', { className: 'ColorCodesImage', src: 'images/color-3.png' }),
					React.createElement('img', { className: 'ColorCodesImage', src: 'images/color-2.png' })
				),
				React.createElement(
					'p',
					null,
					'This tool parses your task and looks for activities like ',
					React.createElement(
						'i',
						null,
						'call, meeting, reply, etc.'
					),
					' and show it in different colours. This colour scheme will help you to traverse the list faster. Currently, the tool parses a standard set of activities which are listed below.'
				),
				React.createElement(
					'div',
					{ className: 'ColorCodes' },
					React.createElement(
						'span',
						{ className: 'tag tag--send' },
						'send'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--mail' },
						'mail'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--reply' },
						'reply'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--post' },
						'post'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--call' },
						'call'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--meeting' },
						'meeting'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--discuss' },
						'discuss'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--brainstorm' },
						'brainstorm'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--buy' },
						'buy'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--get' },
						'get'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--book' },
						'book'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--order' },
						'order'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--work' },
						'work'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--personal' },
						'personal'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--write' },
						'write'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--draft' },
						'draft'
					),
					React.createElement(
						'span',
						{ className: 'tag tag--publish' },
						'publish'
					)
				)
			),
			React.createElement(
				'div',
				{ className: 'Break' },
				'* \u2003 * \u2003 *'
			),
			React.createElement(
				'div',
				{ className: 'Features' },
				React.createElement(
					'blockquote',
					null,
					'\u201CTips to make a better to-do\u201D'
				),
				React.createElement(
					'p',
					null,
					'To-do list helps you to offload tasks from your memory, but at the same time as the list grows it will make us gloomy. So we need to be smart building the task list.'
				),
				React.createElement(
					'p',
					null,
					'First of all, make the to-do smaller. Because we only have limited time in a day to do it. If you have a big task on your plate, try to split it into small tasks. But when you are writing it, write it completely. Don\'t try to shorten it. e.g., instead of writing "call Peter",  write "call Peter to finalise weekend plan". By the end of the day reevaluate your to-do list, remove the low priority tasks and add new tasks for the next day. And sleep peacefully!'
				)
			),
			React.createElement(
				'div',
				{ className: 'Break' },
				'* \u2003 * \u2003 *'
			),
			React.createElement(
				'div',
				{ className: 'Features' },
				React.createElement(
					'blockquote',
					null,
					'\u201CMade with love\u201D'
				),
				React.createElement(
					'p',
					null,
					'This tool is designed and developed by a triad called ',
					React.createElement(
						'a',
						{ href: 'http://27ae60.com' },
						'27AE60'
					),
					' based out of Bengaluru, India. We as a team love developing tools and researching product ideas. We build this tool to keep us productive as well as you. Cheers!'
				),
				React.createElement('img', { className: 'team-logo', src: 'images/27ae60-logo.png' })
			)
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

var TextBox = React.createClass({
	propTypes: {
		onEnter: React.PropTypes.func,
		value: React.PropTypes.string,
		placeholder: React.PropTypes.string
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
			autoFocus: true,
			className: 'TextBox',
			placeholder: this.props.placeholder,
			value: this.state.value,
			onChange: this.handleChange.bind(this),
			onKeyPress: this.handleKeyPress.bind(this) });
	}
});

var Todolist = React.createClass({
	propTypes: {
		items: React.PropTypes.array,
		activities: React.PropTypes.array,
		onTaskCheck: React.PropTypes.func,
		onTaskDelete: React.PropTypes.func
	},

	getDefaultProps: function () {
		return {
			items: [],
			activities: []
		};
	},

	todolistItems: function () {
		if (this.props.items.length <= 0) {
			return React.createElement(Todolist.Empty, null);
		} else {
			var tags = [];

			return this.props.items.map(function (item) {
				tags = item.tags.map(function (tag) {
					return this.props.activities.find(function (activity) {
						return activity.id === tag;
					});
				}, this);

				return React.createElement(Todolist.Item, {
					id: item.id,
					createdOn: item.createdOn,
					task: item.task,
					done: item.done,
					tags: tags,
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
		createdOn: React.PropTypes.string,
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
				moment(this.props.createdOn, 'x').fromNow()
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
	propTypes: {
		layout: React.PropTypes.string,
		layouts: React.PropTypes.array,
		goto: React.PropTypes.func
	},

	goto: function (link) {
		this.props.goto(link);
	},

	links: function () {
		return this.props.layouts.map(function (layout) {
			if (layout.link !== this.props.layout) {
				return React.createElement(
					'li',
					{ className: 'Links__Item',
						onClick: this.goto.bind(this, layout.link) },
					layout.name
				);
			}
		}, this);
	},

	render: function () {
		return React.createElement(
			'footer',
			null,
			React.createElement(
				'nav',
				{ className: 'Links' },
				this.links()
			),
			React.createElement(Footer.Images, null)
		);
	}
});

Footer.Images = React.createClass({
	render: function () {
		return React.createElement(
			'div',
			null,
			React.createElement('img', { className: 'Bird Bird--right', src: 'images/birds.png' }),
			React.createElement('img', { className: 'Bird Bird--middle', src: 'images/birds.png' }),
			React.createElement('img', { className: 'Bird Bird--left', src: 'images/birds.png' }),
			React.createElement('img', { className: 'Cloud Cloud--right', src: 'images/cloud-1.png' }),
			React.createElement('img', { className: 'Cloud Cloud--left', src: 'images/cloud-1.png' })
		);
	}
});

var Activitylist = React.createClass({
	propTypes: {
		items: React.PropTypes.array,
		onColorChange: React.PropTypes.func,
		onDeleteActivity: React.PropTypes.func
	},

	items: function () {
		return this.props.items.map(function (item) {
			return React.createElement(Activity, { id: item.id,
				name: item.name,
				color: item.color,
				onColorChange: this.props.onColorChange,
				onDelete: this.props.onDeleteActivity });
		}, this);
	},

	render: function () {
		return React.createElement(
			'ol',
			{ 'class': 'Activitylist' },
			this.items()
		);
	}
});

var Activity = React.createClass({
	propTypes: {
		id: React.PropTypes.string,
		name: React.PropTypes.string,
		color: React.PropTypes.string,
		onColorChange: React.PropTypes.func,
		onDelete: React.PropTypes.func
	},

	handleColorChange: function (color) {
		this.props.onColorChange(this.props.id, color);
	},

	handleDelete: function () {
		this.props.onDelete(this.props.id);
	},

	render: function () {
		var activityClasses = classNames({
			'Activity__Name': true
		}, 'Color--' + this.props.color);

		return React.createElement(
			'li',
			{ className: 'Activity' },
			React.createElement(
				'p',
				{ className: activityClasses },
				this.props.name
			),
			React.createElement(
				'div',
				{ className: 'Activity__Pallete' },
				React.createElement(Pallete, { selected: this.props.color,
					onColorChange: this.handleColorChange.bind(this) })
			),
			React.createElement(
				'button',
				{ type: 'button',
					onClick: this.handleDelete.bind(this),
					className: 'Activity__Delete' },
				'\u2716'
			)
		);
	}
});

var Pallete = React.createClass({
	propTypes: {
		selected: React.PropTypes.string,
		onColorChange: React.PropTypes.func
	},

	getInitialState: function () {
		return {
			colors: Colors
		};
	},

	swatches: function () {
		return this.state.colors.map(function (color) {
			return React.createElement(Pallete.Swatch, { color: color,
				selected: this.props.selected === color ? true : false,
				onColorChange: this.props.onColorChange });
		}, this);
	},

	render: function () {
		return React.createElement(
			'ul',
			{ className: 'Pallete' },
			this.swatches()
		);
	}
});

Pallete.Swatch = React.createClass({
	propTypes: {
		color: React.PropTypes.string,
		selected: React.PropTypes.bool,
		onColorChange: React.PropTypes.func
	},

	getDefaultProps: function () {
		return {
			color: '',
			selected: false
		};
	},

	handleClick: function () {
		this.props.onColorChange(this.props.color);
	},

	render: function () {
		var swatchClasses = classNames({
			'Pallete__Swatch': true,
			'Pallete__SelectedSwatch': this.props.selected
		}, 'Color--' + this.props.color + '-bg');

		return React.createElement('li', { className: swatchClasses, onClick: this.handleClick.bind(this) });
	}
});

function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16 | 0,
		    v = c == 'x' ? r : r & 0x3 | 0x8;
		return v.toString(16);
	});
}

function preload() {
	if (ActivityStore.get().length <= 0 && localStorage.getItem('TodoTab-Status') === null) {
		Activities.forEach(function (Activity) {
			Activity.id = uuid();
			ActivityStore.add(Activity);
			localStorage.setItem('TodoTab-Status', 'installed');
		});
	}
}

window.onload = function () {
	preload();
	ReactDOM.render(React.createElement(Layout, null), document.getElementById('app'));
};
