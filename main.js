// require("./lib.js")

console.log('main')
import {ToyReact, Component} from "./ToyReact.js"


class MyComponent extends Component{
  render(){
    return <div>
      <span>hello</span>
      <span>world</span>
      <div>
        {this.children}
      </div>
    </div>
  }
}
let a = <MyComponent name = 'a' id = 'ida'>
  <span>1</span>
  <span>2</span>
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