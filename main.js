console.log('main')
import {ToyReact, Component} from "./ToyReact.js"

class Square extends Component {
  constructor(props){
    super(props);
    this.state =  {
      value:null
    }
  }
  render() {
    return ( 
      <button className = "square" onClick={()=>{
        // console.log('click', this.props.value)
        this.setState({value: 'X'})
      }}> {
        this.state.value
      }
      </button>
    );
  }
}

class Board extends Component {
  renderSquare(i) {
    return (
      <Square
        value={i}
      />
      // <Square
      //   value={this.props.squares[i]}
      //   onClick={() => this.props.onClick(i)}
      // />
    );
  }

  render() {
    return (
      <div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    );
  }
}

class MyComponent extends Component{
  render(){
    return (<Board></Board>
    )
  }
}
let a = <MyComponent name = 'a' id = 'ida'>
  {/* <span>1</span>
  <span>2</span> */}
</MyComponent>
// let a =  <div name="a" id='ida'>
//   <span>hello world</span>
//   <span></span>
//   <span></span>
// </div>

console.log('----a', a)
ToyReact.render(
  a,
  document.body
)
// document.body.appendChild(a)