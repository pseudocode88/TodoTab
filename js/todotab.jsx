'use strict';

var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

var todoPostSave = function()    {
	var unfinished = this.data.filter(function(task)   {
		return task.done === false;
	});

	var finished = this.data.filter(function(task)   {
		return task.done === true;
	});

	if(finished.length)    {
		finished = finished.sort(function(x, y){
			return y.checkedOn - x.checkedOn;
		});
	}

	this.data = unfinished.concat(finished);

	return this.data;
};

function escapeRegExp(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|\@\#\~\_]/g, "\\$&");
}

function tokenRegEx(token) {
	return new RegExp("(?:^|\\s|" + escapeRegExp(token) + ")(?:$|\\s)", "gi");
}

var TodoStore = new Store('TodoTab-Tasks', todoPostSave);
var FinishedStore = new Store('TodoTab-Finished');
var ActivityStore = new Store('TodoTab-Activities');

function extractHostname(url) {
	var hostname;

	if (url.indexOf("://") > -1) {
		hostname = url.split('/')[2];
	}
	else {
		hostname = url.split('/')[0];
	}

	hostname = hostname.split(':')[0];
	hostname = hostname.split('?')[0];

	return hostname;
}

function extractRootDomain(url) {
	var domain = extractHostname(url),
	splitArr = domain.split('.'),
	arrLen = splitArr.length;

	if (arrLen > 2) {
		domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
		if (splitArr[arrLen - 1].length == 2 && splitArr[arrLen - 1].length == 2) {
			domain = splitArr[arrLen - 3] + '.' + domain;
		}
	}
	return domain;
}

var Layout = React.createClass({

	layouts: [
	{ name: 'Back to Todo', link: 'home'},
	{ name: 'Customize Activities', link: 'customize'},
	{ name: 'Help', link: 'help'}
	],

	getInitialState: function()	{
		return { layout: 'home' }
	},

	goto: function(link)	{
		this.setState({ layout: link });
	},

	render: function()  {
		var content = [];

		switch(this.state.layout)	{
			case 'home':
			content.push(
				<Layout.Home />
				);
			break;
			case 'customize':
			content.push(
				<Layout.Customize />
				);
			break;
			case 'help':
			content.push(
				<Layout.Help />
				);
			break;
		}

		content.push(
			<Footer
			layout={this.state.layout}
			layouts={this.layouts}
			goto={this.goto.bind(this)}/>
			);
		return <div>{content}</div>;
	}
});

Layout.Home = React.createClass({
	getInitialState: function()	{
		return {
			tasks: [],
			activities: []
		}
	},

	componentDidMount: function()	{
		this.setState({
			tasks: TodoStore.get(),
			activities: ActivityStore.get()
		});
	},

	finishTask: function(id, done)	{
		TodoStore.update(id, {
			done: !done,
			checkedOn: (done) ? null : Date.now()
		});
		mixpanel.track("Finish task");
		this.setState({ tasks: TodoStore.get() });
	},

	editTask: function(id, task) {
		var matches = [];
		
		this.state.activities.forEach(function(activity) {
			if(task.match(tokenRegEx(activity.name))) {
				matches.push(activity.id);
			}
		});

		TodoStore.update(id, {
			task: task,
			tags: matches
		});
		mixpanel.track("Edit task");
		this.setState({ tasks: TodoStore.get() });
	},

	addTask: function(task)	{
		var matches = [];

		if(task.trim().length <= 0)  {
			return false;
		}

		this.state.activities.forEach(function(activity) {
			if(task.match(tokenRegEx(activity.name))) {
				matches.push(activity.id);
			}
		});

		var todo = {
			id: uuid(),
			createdOn: Date.now(),
			checkedOn: null,
			task: task,
			tags: matches,
			done: false
		};

		TodoStore.add(todo);
		mixpanel.track("Add task");
		this.setState({ tasks: TodoStore.get() });
	},

	deleteTask: function(id)	{
		TodoStore.delete(id);
		mixpanel.track("Delete task");
		this.setState({ tasks: TodoStore.get() });
	},

	moveTodo: function(index) {
		TodoStore.move(index.oldIndex, index.newIndex);
		this.setState({ tasks: TodoStore.get() });
	},

	finishedTask: function(task)	{
		return task.done === true;
	},
	
	clearFinishedTask: function()	{
		function deleteTask(task)	{
			TodoStore.delete(task.id);
		}

		this.state.tasks.filter(this.finishedTask).forEach(deleteTask);
		this.setState({ tasks: TodoStore.get() });
	},

	setTitleNotification: function() {
		var taskCount = this.state.tasks.filter(function(e) { return !e.done; }).length;

		if(taskCount === 0)	{
			document.title = 'Todo Tab';
		}else {
			document.title = '(' + taskCount + ') task' + (taskCount > 1 ? 's' : '')  +' remaining.';
		}
	},

	clearFinishedTaskLink: function()	{
		
		if(this.state.tasks.filter(this.finishedTask).length > 5) {
			return <ClearFinishedTask onClick={this.clearFinishedTask}/>
		}

		return null;
	},

	render: function()  {
		this.setTitleNotification();

		return (
			<div>
			<DateTime/>

			<TextBox
			placeholder="Add your tasks for the day…"
			onEnter={this.addTask.bind(this)}/>

			<Todolist
			items={this.state.tasks}
			activities={this.state.activities}
			onDragDrop={this.moveTodo}
			onTaskCheck={this.finishTask}
			onTaskRename={this.editTask}
			onTaskDelete={this.deleteTask}/>
			{this.clearFinishedTaskLink()}
			</div>
			);
	}
});

Layout.Customize = React.createClass({

	getInitialState: function()	{
		return {
			activities: []
		}
	},

	componentDidMount: function()	{
		this.setState({ activities: ActivityStore.get() });
	},

	addActivity: function(name) {
		if(name.trim().length <= 0)  {
			return false;
		}

		name = name.replace(/\s+$/, '');
		
		var activity = {
			id: uuid(),
			name: name,
			color: 'default'
		}

		ActivityStore.add(activity);
		this.setState({ activities: ActivityStore.get() });

		var tasks = TodoStore.get();
		mixpanel.track("Add Activity");
		tasks.forEach(function(task) {
			if(task.task.match(tokenRegEx(name))) {
				task.tags.push(activity.id);
				TodoStore.update(task.id, { tags: task.tags });
			}
		});

	},

	deleteActivity: function(id)	{
		ActivityStore.delete(id);
		this.setState({ activities: ActivityStore.get() });
		mixpanel.track("Delete Activity");
		var tasks = TodoStore.get(),
		found = -1,
		tags = [];

		tasks.forEach(function(task)	{
			tags = task.tags;
			found = tags.indexOf(id);
			if(found >= 0)	{
				tags.splice(found, 1);
				TodoStore.update(task.id, { tags: tags} );
			}
		});
	},

	updateActivityColor: function(id, color)	{
		ActivityStore.update(id, { color: color });
		this.setState({ activities: ActivityStore.get() });
	},

	render: function()	{
		return (
			<div>
			<div className="CustomizeHeder">
			<h1>Customize Color Codings</h1>
			<p>Add and delete your color code vocabulary</p>
			</div>
			<TextBox
			placeholder="Add a custom color code. eg. project, project/todo"
			onEnter={this.addActivity.bind(this)}/>

			<Activitylist items={this.state.activities}
			onColorChange={this.updateActivityColor}
			onDeleteActivity={this.deleteActivity} />
			</div>
			);
	}
})

Layout.Help = React.createClass({
	render: function()	{
		return (
			<div>
			<Layout.Help.Heading/>
			<div className="Break">* &emsp; * &emsp; *</div>
			<Layout.Help.WhatsNew/>
			<div className="Break">* &emsp; * &emsp; *</div>
			<Layout.Help.Features/>
			<div className="Break">* &emsp; * &emsp; *</div>
			<Layout.Help.Tips/>
			<Layout.Help.Credits/>

			<div className="Features">
			<img className="team-logo" src="images/27ae60-logo.png"/>
			</div>
			</div>
			)
	}
});

Layout.Help.Heading = React.createClass({
	render: function()  {
		return (
			<div className="Help__Section">
			<img src="images/icon128.png" className="Logo"/>
			<h1>Todo Tab</h1>
			<p>A privacy first to-do app - version 2.0.0</p>
			</div>
			)
	}
})

Layout.Help.WhatsNew = React.createClass({
	render: function()  {
		return (
			<div className="Features Features--whatsnew">
			<blockquote>
			“What's new 🎉 on version 2.0.0?”
			</blockquote>

			<ol className="WhatsNew">
			<li>
			One of the most awaited and requested feature, the ability to 
			<span className="Color--pomegranate"> create and manage custom colour codes</span>.
			</li>
			<li>
			You can <span className="Color--greensea">reorder your task list</span> as you wish.
			</li>
			<li>
			If you made a typo mistake while adding the task, now you can <span className="Color--pumpkin">edit the description</span>, no more delete and re-entering
			</li>
			<li>
			Shows the <span className="Color--carrot">remaining task count in tab title</span>.
			</li>
			<li>
			If you have more than two completed task, todo tab will <span className="Color--belizehole">hide the rest</span> and keep the todo list always small.
			</li>
			<li>
			<span className="Color--wisteria">Shorter and clickable URLs</span> in task description.
			</li>
			<li>
			If you have more than five completed task, todo tab will give you option to <span className="Color--pomegranate">clear all compeleted task</span> in one go.
			</li>
			</ol>
			</div>
			);
	}
});

Layout.Help.Features = React.createClass({
	render: function()  {
		return (
			<div className="Features">
			<blockquote>“Identify your tasks faster”</blockquote>

			<p>Todo Tab parses your task description and looks for activities <i>(verb)</i> like call, meeting, reply, etc. and show it in different colours. This feature improves the readability of the list and helps you to recognise as well as recall the context faster.</p>

			<img src="images/todotab-mockup-1.png"/>

			<blockquote>
			“Customize your colour codes”
			</blockquote>

			<p>By default Todo Tab provides and a standard set of verbs for you to start. Also, gives you the flexibility to create custom colour codings with special characters. And for the colours, the app provides a palette of 8 colours.</p>

			<ol className="Pallete">
			<li className="Pallete__Swatch Color--default-bg"></li>
			<li className="Pallete__Swatch Color--carrot-bg"></li>
			<li className="Pallete__Swatch Color--pumpkin-bg"></li>
			<li className="Pallete__Swatch Color--pomegranate-bg"></li>
			<li className="Pallete__Swatch Color--posh-bg"></li>
			<li className="Pallete__Swatch Color--greensea-bg"></li>
			<li className="Pallete__Swatch Color--belizehole-bg"></li>
			<li className="Pallete__Swatch Color--wisteria-bg"></li>
			</ol>

			<img src="images/todotab-mockup-2.png"/>
			</div>
			);
	}
});

Layout.Help.Tips = React.createClass({
	render: function()  {
		return (
			<div className="Features">
			<blockquote>“Tips to make a better to-do”</blockquote>
			<p>To-do list helps you to offload tasks from your memory, but at the same time as the list grows it will make us gloomy. So we need to be smart building the task list.</p>
			<p>First of all, make the to-do smaller. Because we only have limited time in a day to do it. If you have a big task on your plate, try to split it into small tasks. But when you are writing it, write it completely. Don't try to shorten it. e.g., instead of writing "call Peter",  write "call Peter to finalise weekend plan". By the end of the day reevaluate your to-do list, remove the low priority tasks and add new tasks for the next day. And sleep peacefully!</p>
			</div>
			)
	}
})

Layout.Help.Credits = React.createClass({
	render: function()  {
		return (
			<div className="Features">
			<blockquote>“Made with love”</blockquote>
			<p>This tool is designed and developed by a triad called <a href="http://27ae60.com">27AE60</a> based out of Bengaluru, India. We as a team love developing tools and researching product ideas. We build this tool to keep us productive as well as you. Cheers!</p>
			<Layout.Help.Subscribe/>
			<p><b>Credits:</b> Jaison Justus, Rabi C Shah & Suyash Katiyar.</p>
			<p><b>Special thanks for writing us a feedback:</b> Les Viragh Jr., Gary Elle, Nicole Fetscher, Kimberly Wolfson, Jake Carni, Sridhar Rajendran, Jocelyn, Arun Chandrasekaran, Sudarsh M.S, Russell Jamison and Kiran Savadatti</p>
			<blockquote>Send us your feebacks at: <a href="mailto:hello@27ae60.com">hello@27ae60.com</a></blockquote>
			</div>
			)
	}
});

Layout.Help.SpecialThanks = React.createClass({
	render: function()  {
		return (
			<div className="Features">
			<p><b>Special thanks for writing us a feedback:</b></p>
			<p>Les Viragh Jr., Gary Elle, Nicole Fetscher, Kimberly Wolfson, Jake Carni, Sridhar Rajendran, Jocelyn, Arun Chandrasekaran, Sudarsh M.S and Russell Jamison</p>
			</div>
			)
	}
});

Layout.Help.Subscribe = React.createClass({
	handleOnSubmit: function()  {
		window.open('https://tinyletter.com/27ae60', 'popupwindow', 'scrollbars=yes,width=450,height=600');
		return true
	},

	render: function()  {
		return (
			<form className="Features Features--subscribe Subscribe" action="https://tinyletter.com/27ae60" method="post" target="popupwindow" onSubmit={this.handleOnSubmit}>
			<blockquote>
			“Connect with 27AE60”
			</blockquote>
			<p className="Subscribe__Description">Join our mailing list and get updates about our product and service. And we will never, ever, ever, spam your inbox because we also hate spams.</p>
			<label className="Subscribe__Label" for="tlemail">Enter your email address</label>
			<input className="Subscribe__Email" type="text" name="email" id="tlemail" />
			<input type="hidden" value="1" name="embed"/>
			<input className="Button" type="submit" value="Subscribe"/>
			<a className="Subscribe__Poweredby" href="https://tinyletter.com" target="_blank">powered by TinyLetter</a>
			</form>
			);
	}
});

var DateTime = React.createClass({
	getInitialState: function() {
		return {
			date: moment().format('MMM Do, dddd'),
			time: moment().format('LT')
		};
	},

	componentDidMount: function()	{
		setInterval(function()  {
			this.setState({ time: moment().format('LT') });
		}.bind(this), 60);
	},

	render: function()  {
		return (
			<div className="DateTime">
			<span className="DateTime__Date">{this.state.date}</span>
			<span className="DateTime__Time">{this.state.time}</span>
			</div>
			);
	}
});

var TextBox = React.createClass({
	propTypes: {
		onEnter: React.PropTypes.func,
		value: React.PropTypes.string,
		placeholder: React.PropTypes.string
	},

	getInitialState: function()	{
		return { value: this.props.value }
	},

	getDefaultProps: function()	{
		return {
			value: '',
			onEnter: function() {}
		}
	},

	handleKeyPress: function(e)	{
		if(e.which === 13)	{
			this.props.onEnter(e.target.value);
			this.setState({ value: '' });
		}
	},

	handleChange: function(e)	{
		this.setState({ value: e.target.value });
	},

	render: function()	{
		return (
			<input type="text"
			autoFocus={!isFirefox}
			className="TextBox"
			placeholder={this.props.placeholder}
			value={this.state.value}
			onChange={this.handleChange.bind(this)}
			onKeyPress={this.handleKeyPress.bind(this)}/>
			);
	}
});

var Todolist = React.createClass({
	propTypes: {
		items: React.PropTypes.array,
		activities: React.PropTypes.array,
		onTaskCheck: React.PropTypes.func,
		onTaskDelete: React.PropTypes.func
	},

	getInitialState: function()	{
		var hideCompleted = JSON.parse(localStorage.getItem('TodoTab-Rollup-State'));
		if (hideCompleted === null) {
			localStorage.setItem('TodoTab-Rollup-State', true);
		}

		return {
			hideCompleted : hideCompleted
		}
	},

	getDefaultProps: function()	{
		return {
			items: {},
			activities: []
		}
	},

	getActivityObjects: function(tags)	{
		return tags.map(function(tag)	{
			return this.props.activities.find(function(activity)	{
				return activity.id === tag
			});
		}, this);
	},

	onToggleList: function()	{
		localStorage.setItem('TodoTab-Rollup-State', !this.state.hideCompleted);
		this.setState({ hideCompleted: !this.state.hideCompleted });
	},

	render: function()	{
		var noOfItems = this.props.items.length;
		var noOfFinishedItems = this.props.items.filter(function(e) {
			return e.done;
		}).length;

		var ToggleList = (
			<Todolist.ToggleList
			toggleMode={this.state.hideCompleted}
			onClick={this.onToggleList.bind(this)}
			/>
			);

		var Empty = (
			<div className="Empty">
			<img className="Empty__Buddha" src="images/buddha.png"/>
			“No tasks remaining.<br/>
			Take a deep breath and enjoy the peace!”
			</div>
			);

      // IMP: Distance of 1 to avoid click events from children
      // of SortableList being swallowed. Also, '2' is the limit
      // of no of finished items to display.
      return (
      	<div>
      	{!noOfItems ? Empty : null}
      	<SortableList
      	lockAxis="y"
      	distance={1}
      	pressThreshold={5}
      	lockToContainerEdges={true}
      	showBorder={noOfFinishedItems <= 2}
      	items={this.state.hideCompleted ? this.props.items.slice(0, noOfItems - noOfFinishedItems + 2) : this.props.items}
      	getActivityObjects={this.getActivityObjects}
      	onCheck={this.props.onTaskCheck}
      	onEdit={this.props.onTaskRename}
      	onDelete={this.props.onTaskDelete}
      	onSortEnd={this.props.onDragDrop} />
      	{noOfFinishedItems > 2 ? ToggleList : null}
      	</div>
      	)
  }
});

var SortableItem = window.SortableHOC.SortableElement(function (_ref) {
	var item = _ref.value;
	return (
		<Todolist.Item
		index={_ref.index}
		id={item.id}
		createdOn={item.createdOn}
		task={item.task}
		done={item.done}
		tags={_ref.getActivityObjects(item.tags)}
		onCheck={_ref.onCheck}
		onEdit={_ref.onEdit}
		onDelete={_ref.onDelete} />
		)
});

var SortableList = window.SortableHOC.SortableContainer(function (_ref) {
  // Adding Todolist--Only to add bottom-borders when ViewAll or RollUp
  // is hidden.
  var todoListCx = classNames({
  	'Todolist': true,
  	'Todolist--Only': _ref.showBorder,
  });

  return (
  	<ul className={todoListCx} id="todos">
  	{
  		_ref.items.map(function (value, index) {
  			return React.createElement(SortableItem, {
  				key: "item-" + index,
  				index: index,
  				value: value,
  				disabled: value.done,
  				getActivityObjects: _ref.getActivityObjects,
  				onCheck: _ref.onCheck,
  				onEdit: _ref.onEdit,
  				onDelete: _ref.onDelete });
  		})
  	}
  	</ul>
  	)
});

Todolist.ToggleList = React.createClass({
	propTypes: {
		toggleMode: React.PropTypes.bool,
		onClick: React.PropTypes.func
	},

	render: function()	{
		return (
			<div className="Todo Todo--toggle" onClick={this.props.onClick}>
			{(this.props.toggleMode) ? 'View All' : 'Roll Up'}
			</div>
			);
	}
});

Todolist.Item = React.createClass({
	propTypes: {
		index: React.PropTypes.number,
		id: React.PropTypes.string,
		createdOn: React.PropTypes.string,
		task: React.PropTypes.string,
		done: React.PropTypes.bool,
		tags: React.PropTypes.array,
		onCheck: React.PropTypes.func,
		onDelete: React.PropTypes.func,
		onEdit: React.PropTypes.func
	},

	getInitialState: function() {
		return {
			edit: false
		}
	},

	wrapColourCoding: function(text, color) {
		return '<span class="Color Color--' + color + '"> '+ text +' </span>';
	},
	
	createColourCoding: function(task, tags, done)	{
		var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

		var urls = task.match(urlRegex),
		domain = '';

		if(urls)	{
			urls.forEach(function(url)	{
				domain = extractRootDomain(url);
				task = task.replace(
					url,
					'<a href="' + url +'" data-url="' + url  + '" class="Todo__Link" target="_blank" onclick="function(e) { e.stopPropagation(); }">' + domain + '…</a>'
					);
			}, this);
		}
		if(!done)	{
			var matches = [];

			tags.forEach(function(tag) {
                if (tag && tag.name && task) {
				  task = task.trim().replace(tokenRegEx(tag.name), this.wrapColourCoding(tag.name, tag.color));
                }
			}, this);
		}

		return { __html: task }
	},

	handleCheck: function(e)	{
		e.stopPropagation();
		if(e.target.className !== 'Todo__Link' && !this.state.edit){
			this.props.onCheck(this.props.id, this.props.done);
		}
	},

	handleDelete: function()	{
		this.props.onDelete(this.props.id);
	},

	handleEdit: function(value)  {
		this.setState({ edit: false });
		if (!value || this.props.task === value) {
			this.textField.innerHTML = this.prevTextFieldHTML;
			return;
		}

		this.props.onEdit(this.props.id, value);
	},

	handleKeyDownOnEditTextInput: function(e)  {
		e.stopPropagation();
		const value = e.target.value;

		switch (e.key) {
			case 'Escape':
			case 'Enter':
			e.target.onblur = function() {};
			this.handleEdit(value);
			break;

			default:
			break;
		}
	},

	handleBlurOnEditTextInput: function(e)  {
		const value = e.target.value;
		this.handleEdit(value);
	},

	handleClickOnEditButton: function() {
		this.setState({ edit: true });

		this.prevTextFieldHTML = this.textField.innerHTML;

		var input = document.createElement('input');
		input.value = this.props.task;
		input.className = 'Todo__Input';
		input.onkeydown = this.handleKeyDownOnEditTextInput.bind(this);
		input.onblur = this.handleBlurOnEditTextInput.bind(this);
		input.onclick = function(e) { e.stopPropagation(); e.preventDefault(); }

		this.textField.innerHTML = "";
		this.textField.appendChild(input);

		input.focus();
	},

	render: function()	{
		var todoClasses = classNames({
			'Todo': true,
			'Todo--checked': this.props.done,
			'Todo--onedit': this.state.edit,
		});

		var todoEditClasses = classNames({
			'Todo__Edit': true,
			'Todo__Edit--onChecked': this.props.done,
			'Todo__Edit--onedit': this.state.edit
		});

		var todoDeleteClasses = classNames({
			'Todo__Delete': true,
			'Todo__Delete--onedit': this.state.edit
		});

		var todoTaskClassesOnEdit = classNames({
			'Todo__Task': true,
			'Todo__Task--onedit': this.state.edit
		});

		return (
			<li className={todoClasses}
			draggable={!this.props.done}
			data-id={this.props.index}>
				<span className="Todo__Check">
					<i onClick={this.handleCheck.bind(this)}></i>
				</span>
				
				<p className={todoTaskClassesOnEdit}
					ref={function (text) { this.textField = text; }.bind(this)}
					onClick={this.handleCheck.bind(this)}
					dangerouslySetInnerHTML={this.createColourCoding(this.props.task, this.props.tags, this.props.done)}/>

				<button className={todoEditClasses} onClick={this.handleClickOnEditButton.bind(this)}>edit</button>
			
				<button className={todoDeleteClasses} onClick={this.handleDelete.bind(this)}>✖</button>
			
				<span className="Todo__CreatedOn">
					{moment(this.props.createdOn, 'x').fromNow()}
				</span>
			</li>
			);
	}
});

var ClearFinishedTask = React.createClass({
	propTypes: {
		onClick: React.PropTypes.func
	},

	render: function()	{
		return (
			<p className="ClearFinishedTask" onClick={this.props.onClick}>
			clear all finished tasks
			</p>
			);
	}
});

var Footer = React.createClass({
	propTypes: {
		layout: React.PropTypes.string,
		layouts: React.PropTypes.array,
		goto: React.PropTypes.func,
	},

	goto: function(link)	{
		this.props.goto(link);
	},

	icon: function(link)	{
		switch(link)	{
			case 'customize':
			return <Icon.Settings/>
			case 'help':
			return <Icon.Help/>
			case 'home':
			return <Icon.List/>
		}
	},

	links: function()	{
		var linksItemClasses = {};

		return this.props.layouts.map(function(layout)	{
			linksItemClasses = classNames({
				"Links__Item": true,
				"Links__Item--selected": (layout.link === this.props.layout)
			});

			return (
				<li className={linksItemClasses}
				onClick={this.goto.bind(this, layout.link)}>
				{this.icon(layout.link)}
				</li>
				);
		}, this);
	},

	render: function()	{
		return (
			<footer>
			<nav className="Links">{this.links()}</nav>
			<Footer.Images/>
			</footer>
			);
	}
});

Footer.Images = React.createClass({
	render: function()	{
		return (
			<div>
			<img className="Bird Bird--right" src="images/birds.png"/>
			<img className="Bird Bird--middle" src="images/birds.png"/>
			<img className="Bird Bird--left" src="images/birds.png"/>
			<img className="Cloud Cloud--right" src="images/cloud-1.png"/>
			<img className="Cloud Cloud--left" src="images/cloud-1.png"/>
			</div>
			);
	}
});

var Activitylist = React.createClass({
	propTypes: {
		items: React.PropTypes.array,
		onColorChange: React.PropTypes.func,
		onDeleteActivity: React.PropTypes.func
	},

	items: function()	{
		return this.props.items.map(function(item)	{
			return (
				<Activity id={item.id}
				name={item.name}
				color={item.color}
				onColorChange={this.props.onColorChange}
				onDelete={this.props.onDeleteActivity}/>
				);
		}, this);
	},

	render: function()	{
		return (
			<ol class="Activitylist">{this.items()}</ol>
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

	handleColorChange: function(color)	{
		this.props.onColorChange(this.props.id, color);
	},

	handleDelete: function()	{
		this.props.onDelete(this.props.id);
	},

	render: function()	{
		var activityClasses = classNames({
			'Activity__Name': true,
		}, 'Color--' + this.props.color);

		return (
			<li className="Activity">
			<p className={activityClasses}>{this.props.name}</p>
			<div className="Activity__Pallete">
			<Pallete selected={this.props.color}
			onColorChange={this.handleColorChange.bind(this)}/>
			</div>
			<button type="button"
			onClick={this.handleDelete.bind(this)}
			className="Activity__Delete">✖</button>
			</li>
			);
	}
});

var Pallete = React.createClass({
	propTypes: {
		selected: React.PropTypes.string,
		onColorChange: React.PropTypes.func
	},

	getInitialState: function()	{
		return {
			colors: Colors
		}
	},

	swatches: function()	{
		return this.state.colors.map(function(color)	{
			return (
				<Pallete.Swatch color={color}
				selected={(this.props.selected === color) ? true : false}
				onColorChange={this.props.onColorChange}/>
				);
		}, this);
	},

	render: function()	{
		return (
			<ul className="Pallete">{this.swatches()}</ul>
			);
	}
});

Pallete.Swatch = React.createClass({
	propTypes: {
		color: React.PropTypes.string,
		selected: React.PropTypes.bool,
		onColorChange: React.PropTypes.func
	},

	getDefaultProps: function()	{
		return {
			color: '',
			selected: false
		}
	},

	handleClick: function()	{
		this.props.onColorChange(this.props.color);
	},

	render: function()	{
		var swatchClasses = classNames({
			'Pallete__Swatch': true,
			'Pallete__SelectedSwatch': this.props.selected
		}, 'Color--' + this.props.color + '-bg');

		return (
			<li className={swatchClasses} onClick={this.handleClick.bind(this)}></li>
			)
	}
});

var Icon = {};

Icon.Settings = React.createClass({
	render: function()	{
		return (
			<svg className="Icon Icon--settings" fill="#795e23" viewBox="0 0 24 24"  xmlns="http://www.w3.org/2000/svg">
			<path d="M0 0h24v24H0z" fill="none"/>
			<path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
			</svg>
			);
	}
});

Icon.Help = React.createClass({
	render: function()	{
		return (
			<svg className="Icon Icon--help" fill="#795e23" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M0 0h24v24H0z" fill="none"/>
			<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
			</svg>
			);
	}
});

Icon.List = React.createClass({
	render: function()	{
		return (
			<svg className="Icon Icon--list" fill="#795e23" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
			<path d="M0 0h24v24H0z" fill="none"/>
			</svg>
			);
	}
});

function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function addActivity(Activity)	{
	Activity.id = uuid();
	ActivityStore.add(Activity);
}

function addTask(task)	{
	var matches = [];

	if (!task) {
		return false;
	}

	ActivityStore.get().forEach(function(activity) {
		var regex = tokenRegEx(activity.name);

		if(task.description.match(regex)) {
			matches.push(activity.id);
		}
	});

	var todo = {
		id: uuid(),
		createdOn: task.id,
		checkedOn: Date.now(),
		task: task.description,
		tags: matches,
		done: (task.status) ? false : true
	};

	TodoStore.add(todo);
}

function install()	{
	var version = localStorage.getItem('TodoTab-Version');

	if(version === null) {

		if(ActivityStore.get().length <= 0)	{
			Activities.forEach(addActivity);	
		}

		var oldTasks = localStorage.getItem('TodoList-01');

		if(oldTasks !== null) {
			var tasks = JSON.parse(oldTasks);
			tasks.forEach(addTask);
		}
		
		mixpanel.track("Update to v2.0.0");
		localStorage.setItem('TodoTab-Version', '2.0.0');
	}

	if(ActivityStore.get().length <= 0
		&& localStorage.getItem('TodoTab-Status') === null)	{

		Activities.forEach(function(Activity)	{
			Activity.id = uuid();
			ActivityStore.add(Activity);
			mixpanel.track("Install v2.0.0");
			localStorage.setItem('TodoTab-Status', 'installed');
		});

}
}

window.onload = function() {
	mixpanel.init("752c57b1305ae840fe06398f966b22cb");
	install();
	ReactDOM.render(<Layout/>, document.getElementById('app'));
};

document.title = 'Todo Tab';
