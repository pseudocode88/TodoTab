'use strict';

var TodoStore = new Store('TodoTab-Tasks');
var ActivityStore = new Store('TodoTab-Activities');

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
				TodoStore.update(id, 'done', !done);
				this.setState({ tasks: TodoStore.get() });
		},

		addTask: function(task)	{
				var matches = [];

				this.state.activities.forEach(function(activity) {
						var regex = new RegExp('\\b' + activity.name + '\\b', 'gi');

						if(task.match(regex)) {
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

		deleteTask: function(id)	{
				TodoStore.delete(id);
				this.setState({ tasks: TodoStore.get() });
		},

		sortTodo: function()	{
				var sorted = this.state.tasks.sort(function(x, y){
						return y.id - x.id;
				});

				var unfinshed = sorted.filter(function(task)   {
						return task.done === false ;
				});

				var finshed = sorted.filter(function(task)   {
						return task.done === true;
				});

				return unfinshed.concat(finshed);
		},

		render: function()  {

				return (
						<div>
								<DateTime/>
								
								<TextBox 
									placeholder="Add your tasks for the day…"
									onEnter={this.addTask.bind(this)}/>

								<Todolist 
									items={this.sortTodo()} 
									onTaskCheck={this.finishTask}
									onTaskDelete={this.deleteTask}/>
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

	addActivity: function() {},

	deleteActivity: function(id)	{
		console.log(id);
		ActivityStore.delete(id);
		this.setState({ activities: ActivityStore.get() });
	},

	updateActivityColor: function(id, color)	{
		ActivityStore.update(id, 'color', color);
		this.setState({ activities: ActivityStore.get() });
	},

	render: function()	{
		return (
			<div>
				<div className="CustomizeHeder">
					<img src="images/icon128.png" className="Logo"/>
					<h1>Customize Activities</h1>
					<p>Expand your activity list by adding and managing new tags. Feel free to delete the genreic list and add your's</p>
				</div>
				<TextBox 
					placeholder="Add a custom activity. eg. project, project/todo"
					onEnter={this.addActivity.bind(this)}/>
				
				<Activitylist items={this.state.activities}
					onColorChange={this.updateActivityColor}
					onDeleteActivity={this.deleteActivity} />
			</div>
		);
	}
})

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
						autoFocus
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
				onTaskCheck: React.PropTypes.func,
				onTaskDelete: React.PropTypes.func
		},

		getDefaultProps: function()	{
				return {
						items: []
				}
		},

		todolistItems: function()	{
				if(this.props.items.length <= 0)	{
					return <Todolist.Empty/>
				} else {
					return this.props.items.map(function(item) {
							return (
									<Todolist.Item 
											id={item.id} 
											task={item.task} 
											done={item.done}
											tags={item.tags}
											onCheck={this.props.onTaskCheck}
											onDelete={this.props.onTaskDelete}/>
							);
					}, this);
				}
		},

		render: function()	{
				return (
					<ul className="Todolist" id="todos">
						{this.todolistItems()}
					</ul>
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

		createColourCoding: function(task, tags, done)	{
			if(!done)	{
				tags.forEach(function(tag) {
						task = task.replace(
								new RegExp('\\b' + tag.name + '\\b', 'gi'), 
								'<span class="Color Color--' + tag.color + '">'+tag.name+'</span>'
						);
				});
			}

			return { __html: task }
		},

		handleCheck: function()	{
				this.props.onCheck(this.props.id, this.props.done);
		},

		handleDelete: function()	{
				this.props.onDelete(this.props.id);
		},

		render: function()	{
				var todoClasses = classNames({
						'Todo': true,
						'Todo--checked': this.props.done
				});

				return (
						<li className={todoClasses}>
								<span className="Todo__Check">
										<i onClick={this.handleCheck.bind(this)}></i>
								</span>
								<p className="Todo__Task" 
										onClick={this.handleCheck.bind(this)}
										dangerouslySetInnerHTML={this.createColourCoding(this.props.task, this.props.tags, this.props.done)}/>	
								<button className="Todo__Delete" onClick={this.handleDelete.bind(this)}>✖</button>
								<span className="Todo__CreatedOn">
										{moment(this.props.id, 'x').fromNow()}
								</span>
						</li>
				);
		}
});

Todolist.Empty = React.createClass({
	render: function()	{
		return (
			<li className="Empty">
				<img className="Empty__Buddha" src="images/buddha.png"/>
				“No task remaining.<br/> 
				Take a deep breath and enjoy the peace!”
			</li>
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

	links: function()	{
		return this.props.layouts.map(function(layout)	{
			if(layout.link !== this.props.layout)	{
				return (
					<li className="Links__Item" 
						onClick={this.goto.bind(this, layout.link)}>
						{layout.name}
					</li>
				);
			}
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

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function preload()	{
	if(ActivityStore.get().length <= 0 
		&& localStorage.getItem('TodoTab-Status') === null)	{

		Activities.forEach(function(Activity)	{
			Activity.id = uuid();
			ActivityStore.add(Activity);
			localStorage.setItem('TodoTab-Status', 'installed');
		});
		
	}
}

preload();

window.onload = function() {
	ReactDOM.render(<Layout/>, document.getElementById('app'));
};