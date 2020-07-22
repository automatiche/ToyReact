let childrenSymbol = Symbol("children")
class ElementWrapper {
  constructor(type) {
    this.type = type;
    this.props = Object.create(null);
    this[childrenSymbol] = [];
    this.children = [];
  }
  setAttribute(name, value) {
    // if (name.match(/^on([\s\S]+)$/)) {
    //     let eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase());
    //     // let eventName = RegExp.$1.toLocaleLowerCase();
    //     this.root.addEventListener(eventName, value);
    // }
    // if (name === "className") {
    //     name = "class";
    // }
    // this.root.setAttribute(name, value);
    this.props[name] = value;
  }
  appendChild(vchild) {
    this[childrenSymbol].push(vchild);
    this.children.push(vchild.vdom);
    // let range = document.createRange();

    // if (this.root.children.length) {
    //     range.setStartAfter(this.root.lastChild);
    //     range.setEndAfter(this.root.lastChild);
    // } else {
    //     range.setStart(this.root, 0);
    //     range.setEnd(this.root, 0);
    // }
    // vchild.mountTo(range);
  }
  get vdom() {
    return this;
  }
  mountTo(range) {
    this.range = range;
    let placeholder = document.createComment("placeholder");
    let endRange = document.createRange();
    endRange.setStart(range.endContainer, range.endOffset);
    endRange.setEnd(range.endContainer, range.endOffset);
    endRange.insertNode(placeholder);

    range.deleteContents();
    let element = document.createElement(this.type);

    for (let name in this.props) {
      let value = this.props[name];
      if (name.match(/^on([\s\S]+)$/)) {
        let eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase());
        // let eventName = RegExp.$1.toLocaleLowerCase();
        element.addEventListener(eventName, value);
      }
      if (name === "className") {
        name = "class";
      }
      element.setAttribute(name, value);
    }

    for (let child of this.children) {
      let range = document.createRange();

      if (element.children.length) {
        range.setStartAfter(element.lastChild);
        range.setEndAfter(element.lastChild);
      } else {
        range.setStart(element, 0);
        range.setEnd(element, 0);
      }
      child.mountTo(range);
    }


    range.insertNode(element);
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
    this.type = "#text";
    this.children = [];
    this.props = Object.create(null);
  }

  mountTo(range) {
    this.range = range;
    range.deleteContents();
    range.insertNode(this.root);
  }

  get vdom() {
    return this;
  }
}

export class Component {
  constructor() {
    this.children = [];
    this.props = Object.create(null);
  }
  get type() {
    return this.constructor.name;
  }
  setAttribute(name, value) {
    this.props[name] = value;
    this[name] = value;
  }
  mountTo(range) {
    this.range = range;
    this.update();
  }
  update() {
    let vdom = this.vdom;
    if (this.oldVdom) {
      let isSameNode = (node1, node2) => {
        if (node1.type !== node2.type) {
          return false;
        }
        for (let name in node1.props) {
          // if (typeof node1.props[name] === "function"
          //     && node2.props[name] === "function"
          //     && node1.props[name].toString() === node2.props[name].toString()
          // ) {
          //     continue;
          // }
          if (typeof node1.props[name] === "object" &&
            node2.props[name] === "object" &&
            JSON.stringify(node1.props[name]) === JSON.stringify(node2.props[name])
          ) {
            continue;
          }
          if (node1.props[name] !== node2.props[name]) {
            return false;
          }
        }
        if (Object.keys(node1.props).length !== Object.keys(node2.props).length) {
          return false;
        }
        return true;
      }

      let isSameTree = (node1, node2) => {
        if (!isSameNode(node1, node2)) {
          return false;
        }
        if (node1.children.length !== node2.children.length) {
          return false;
        }
        for (let i = 0; i < node1.children.length; i++) {
          if (!isSameTree(node1.children[i], node2.children[i])) {
            return false;
          }
        }
        return true;
      }

      let replace = (newTree, oldTree) => {
        if (isSameTree(newTree, oldTree)) {
          return;
        }

        if (!isSameNode(newTree, oldTree)) {
          newTree.mountTo(oldTree.range);
        } else {
          for (let i = 0; i < newTree.children.length; i++) {
            replace(newTree.children[i], oldTree.children[i])
          }
        }
      }

      console.log("new:", vdom);
      console.log(this.oldVdom);

      replace(vdom, this.oldVdom);
    } else {
      vdom.mountTo(this.range);
    }
    this.oldVdom = vdom;
  }
  get vdom() {
    return this.render().vdom;
  }
  appendChild(vchild) {
    this.children.push(vchild);
  }
  setState(state) {
    let merge = (pre, cur) => {
      for (let p in cur) {
        if (typeof cur[p] === "object" && cur[p] !== null) {
          if (typeof pre[p] !== "object") {
            if (cur[p] instanceof Array) {
              pre[p] = [];
            } else {
              pre[p] = {};
            }
          }
          merge(pre[p], cur[p])
        } else {
          pre[p] = cur[p];
        }
      }
    }
    if (!this.state && state) {
      this.state = {};
    }
    merge(this.state, state);
    console.log(this.state);
    this.update();
  }
}

export let ToyReact = {
  createElement(type, attributes, ...children) {
    let element;
    if (typeof type === "string") {
      element = new ElementWrapper(type);
    } else {
      element = new type;
    }
    for (let name in attributes) {
      element.setAttribute(name, attributes[name]);
    }
    let insertChildren = (children) => {
      for (let child of children) {
        if (typeof child === "object" && child instanceof Array) {
          insertChildren(child);
        } else {
          if (child === null || child === void 0) {
            child = "";
          }
          if (!(child instanceof Component) &&
            !(child instanceof TextWrapper) &&
            !(child instanceof ElementWrapper)) {
            child = String(child);
          }
          if (typeof child === "string") {
            child = new TextWrapper(child);
          }

          element.appendChild(child);
        }
      }
    }
    insertChildren(children);
    return element;
  },
  render(vdom, element) {
    let range = document.createRange();
    if (element.children.length) {
      range.setStartAfter(element.lastChild);
      range.setEndAfter(element.lastChild);
    } else {
      range.setStart(element, 0);
      range.setEnd(element, 0);
    }

    vdom.mountTo(range);
  }
}


// let childrenSymbol = Symbol("children")
// class ElementWrapper {
//   constructor(type){
//     // this.root = document.createElement(type)

//     this.type = type
//     this.props = Object.create(null)
//     // this.children = []
//     this[childrenSymbol] = []
//   }
//   setAttribute(name, value){
//     this.props[name] = value
//   }
//   get children(){
//     this.children.map(child=>child.vdom)
//   }
//   appendChild(vchild){
//     this.children.push(vchild)
//   }
//   // setAttribute(name, value){
//   //   if(name.match(/^on([\s\S]+)$/)){
//   //     let eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase())
//   //     this.root.addEventListener(eventName, value)
//   //   }
//   //   if(name==='className'){
//   //     // name = "class"
//   //     this.root.setAttribute('class', value)
//   //   }
//   //   this.root.setAttribute(name, value)
//   // }
//   // appendChild(vchild){
//   //       let range = document.createRange()
//   //       if (this.root.children.length) {
//   //         range.setStartAfter(this.root.lastChild)
//   //         range.setEndAfter(this.root.lastChild)
//   //       } else {
//   //         range.setStart(this.root, 0)
//   //         range.setEnd(this.root, 0)
//   //       }
//   //       vchild.mountTo(range)
//   // }

//     get vdom() {
//       let vChildren = this.children.map(child => child.vdom)
//       return {
//         type:this.type,
//         props:this.props,
//         children: this.children.map(child =>  child.vdom)
//       }

//     }

    
//   // 虚拟转实
//   mountTo(range){
//     this.range = range
//     range.deleteContents()
//     let element = document.createElement(this.type)
//     for(let name in this.props){
//       let value = this.props[name]
//         if(name.match(/^on([\s\S]+)$/)){
//           let eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase())
//           element.addEventListener(eventName, value)
//         }
//           if (name === 'className') {
//             // name = "class"
//             element.setAttribute('class', value)
//           }
//       element.setAttribute(name, value)
//     }

//       for (let child of this.children) {
//         let range = document.createRange()
//         if (element.children.length) {
//           range.setStartAfter(element.lastChild)
//           range.setEndAfter(element.lastChild)
//         } else {
//           range.setStart(element, 0)
//           range.setEnd(element, 0)
//         }
//         child.mountTo(range)
//       }
//     range.insertNode(element)
//     // parent.appendChild(this.root)
//   }
//   // mountTo(parent){
//   //   parent.appendChild(this.root)
//   // }
// }
// class TextWrapper {
//   constructor(content){
//     this.root = document.createTextNode(content)
//     this.type  = "#text"
//     this.children = []
//     this.props = Object.create(null)
//   }
//   mountTo(range) {
//     this.range = range
//   // mountTo(parent) {
//     range.deleteContents()
//     range.insertNode(this.root)
//     // // parent.appendChild(this.root)
//   }
//   get vdom(){
//     return {
//       type:"#text", 
//       props:this.props,
//       children:[]
//     }
//   }
// }
// export class Component{
//     constructor(){
//       this.children = []
//       this.props = Object.create(null)
//     }
//     get type(){
//       return this.constructor.name
//     }

//     setAttribute(name, value) {
//       if(name.match(/^on([\s\S]+)$/)){
//         console.log('component setattrbute', RegExp.$1)
//       }
//       this.props[name] = value
//       this[name] = value
//     }

//     mountTo(range) {
//       // let vdom = this.render()// this ? render ?
//       // vdom.mountTo(range)
//       this.range = range
//       this.update()
//     }

//     // range 里存的是实dom
//     update(){
//       // let placeholder= document.createComment('placeholder')
//       // let range = document.createRange()
//       // range.setStart(this.range.endContainer, this.range.endOffset)
//       // range.setEnd(this.range.endContainer, this.range.endOffset)
//       // range.insertNode(placeholder)

//       // this.range.deleteContents()

//       // let vdom =  this.render()
//       // vdom.mountTo(this.range)

//       let vdom =  this.render()
//       if(this.vdom){
//         let isSameNode = (node1, node2) => {
//           if(node1.type !== node2.type){
//             return false
//           }
//           for(let name in node1.props){
//             if(node1.props[name] !== node2.props[name]){
//               return false
//             }
//           }
//           if (Object.keys(node1.props).length !== Object.keys(node2.props).length) {
//             return false
//           }
//         }

//         let isSameTree = (node1, node2) => {
//           if(!isSameNode(node1, node2)){
//             return false
//           }
//           if(node1.children.length !== node2.children.length){
//             return false
//           }
//           for(let i = 0; i<node1.children.length; i++){
//             if (!isSameTree(node1.children[i], node2.children[i])) {
//               return false
//             }
//           }
//           return true
//         }

//         let replace = (newTree, oldTree, indent) =>{
//           console.log(indent + 'new', newTree);
//           console.log(indent + 'oldTree', oldTree);


//           if (isSameTree(newTree, oldTree)) {
//             console.log('all same');
//             return
//           }
//           if (!isSameNode(newTree, oldTree)) { // 根节点相同
//             console.log('all different');
//             newTree.mountTo(oldTree.range)
//           } else {
//             for(let i = 0; i< newTree.children.length; i++){
//               replace(newTree.children[i], oldTree.children[i], ' ' + indent )
//             }
//           }
//         }

//         if(isSameTree(vdom, this.vdom)){
//           return
//         }

//         if(!isSameNode(vdom, this.vdom)){ // 根节点相同
//           vdom.mountTo(this.vdom.range)
//         }else{

//         }
//         console.log('new', vdom);
//         console.log('old', this.vdom);
//         replace(vdom, this.vdom, '')

//       }else{
//         vdom.mountTo(this.range)
//       }
//       this.vdom = vdom
//       // placeholder.parentNode.removeChild(placeholder)
//     }

//     get vdom(){
//       return this.render().vdom
      
//     }
//     // mountTo(parent) {
//     //   let vdom = this.render()// this ? render ?
//     //   vdom.mountTo(parent)
//     //   let range = document.createRange()
//     //   range.setStartAfter(parent.lastChild)
//     //   range.setEndAfter(parent.lastChild)
//     // }
//     appendChild(vchild){
//       this.children.push(vchild)
//     }
//     setState(state){
//       let merge = (oldState, newState) => {
//         for(let p in newState){
//           if(typeof newState[p] === "object" && newState[p] !== null){
//             if (typeof oldState[p] !== "object"){
//               if(newState[p] instanceof Array){
//                 oldState[p] = []
//               }else{
//                 oldState[p] = {}
//               }
//             }
//             merge(oldState[p], newState[p])
//           }else{
//             oldState[p] = newState[p]
//           }
//         }
//       }
//       if(!this.state && state){
//         this.state = {};
//       }
//       merge(this.state, state)
//       this.update()
//       console.log('setstate', this.state);
//     }
// }
// export let ToyReact = {
//   createElement (type, attributes, ...children) {
//     let element
//     if(typeof type === "string"){
//       element = new ElementWrapper(type)
//     }else{
//       element = new type

//     }
//     // let element = document.createElement(type);
//     for (let name in attributes) {
//       element.setAttribute(name, attributes[name]);
//     }
//     let insertChildren = (children) => {
//       for (let child of children) {
//         if (typeof child === 'object' && child instanceof Array){
//             insertChildren(child)
//         }else{
//           if(child === null || child === void 0)
//             child = ""
//           if(!(child instanceof Component)
//             && !(child instanceof ElementWrapper)
//             && !(child instanceof TextWrapper))
//             child = String(child)
//           if (typeof child === 'string') {
//             // child = document.createTextNode(child);
//             child = new TextWrapper(child)
//           }
//           element.appendChild(child)
//         }
//         // element.appendChild(child);
//       }
//     }
//     insertChildren(children)
//     // debugger; 
//     return element;
//   },
//   render(vdom, element){
//     let range = document.createRange()
//     if(element.children.length){
//       range.setStartAfter(element.lastChild)
//       range.setEndAfter(element.lastChild)
//     }else{
//       range.setStartAfter(element, 0)
//       range.setEndAfter(element, 0)
//     }
//     vdom.mountTo(range)
//   }
// }

// // ElementWrapper 和 Component 的区别