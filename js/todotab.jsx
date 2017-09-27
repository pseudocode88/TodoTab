'use strict';

var TodoStore = new Store('TodoTab');
var ActivityStore = new Store('Activity');

if(ActivityStore.get().length <= 0)	{
		ActivityStore.addMultiple(Activities);
}

var Layout = React.createClass({
		render: function()  {
				return <Layout.Home/>
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
								
								<AddTaskTextBox 
										onEnter={this.addTask.bind(this)}/>

								<Todolist 
										items={this.sortTodo()} 
										onTaskCheck={this.finishTask}
										onTaskDelete={this.deleteTask}/>
								
								<Footer/>
						</div>
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

var AddTaskTextBox = React.createClass({
		propTypes: {
				onEnter: React.PropTypes.func,
				value: React.PropTypes.string
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
								className="TextBox"
								placeholder="Add your tasks for the day…" 
								name="add-todo" 
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
	render: function()	{
		return (
			<footer>
				<img className="Bird Bird--right" src="images/birds.png"/>
				<img className="Bird Bird--middle" src="images/birds.png"/>
				<img className="Bird Bird--left" src="images/birds.png"/>
				<img className="Cloud Cloud--right" src="images/cloud-1.png"/>
				<img className="Cloud Cloud--left" src="images/cloud-1.png"/>
				<p className="Message">
						<a id="helplink" href="#">Customize activities</a>
						&emsp;•&emsp;
						<a id="helplink" href="#">Help</a>
				</p>
			</footer>
		);
	}
});

window.onload = function() {
		ReactDOM.render(<Layout/>, document.getElementById('app'));
};