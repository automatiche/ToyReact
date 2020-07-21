class ElementWrapper {
  constructor(type){
    this.root = document.createElement(type)
  }
  setAttribute(name, value){
    if(name.match(/^on([\s\S]+)$/)){
      let eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase())
      this.root.addEventListener(eventName, value)
    }
    if(name==='className'){
      // name = "class"
      this.root.setAttribute('class', value)
    }
    this.root.setAttribute(name, value)
  }
  appendChild(vchild){
        let range = document.createRange()
        if (this.root.children.length) {
          range.setStartAfter(this.root.lastChild)
          range.setEndAfter(this.root.lastChild)
        } else {
          range.setStart(this.root, 0)
          range.setEnd(this.root, 0)
        }
        vchild.mountTo(range)
  }
  // 虚拟转实
  mountTo(range){
    range.deleteContents()
    range.insertNode(this.root)
    // parent.appendChild(this.root)
  }
  // mountTo(parent){
  //   parent.appendChild(this.root)
  // }
}
class TextWrapper {
  constructor(content){
    this.root = document.createTextNode(content)
  }
  mountTo(range) {
  // mountTo(parent) {
    range.deleteContents()
    range.insertNode(this.root)
    // // parent.appendChild(this.root)
  }
}
export class Component{
    constructor(){
      this.children = []
      this.props = Object.create(null)
    }

    setAttribute(name, value) {
      if(name.match(/^on([\s\S]+)$/)){
        console.log('component setattrbute', RegExp.$1)
      }
      this.props[name] = value
      this[name] = value
    }

    mountTo(range) {
      // let vdom = this.render()// this ? render ?
      // vdom.mountTo(range)
      this.range = range
      this.update()
    }

    // range 里存的是实dom
    update(){
      let placeholder= document.createComment('placeholder')
      let range = document.createRange()
      range.setStart(this.range.endContainer, this.range.endOffset)
      range.setEnd(this.range.endContainer, this.range.endOffset)
      range.insertNode(placeholder)

      this.range.deleteContents()

      let vdom =  this.render()
      vdom.mountTo(this.range)
      // placeholder.parentNode.removeChild(placeholder)
    }

    // mountTo(parent) {
    //   let vdom = this.render()// this ? render ?
    //   vdom.mountTo(parent)
    //   let range = document.createRange()
    //   range.setStartAfter(parent.lastChild)
    //   range.setEndAfter(parent.lastChild)
    // }
    appendChild(vchild){
      this.children.push(vchild)
    }
    setState(state){
      let merge = (oldState, newState) => {
        for(let p in newState){
          if(typeof newState[p] === "object"){
            if (typeof oldState[p] !== "object"){
              oldState[p] = {}
            }
            merge(oldState[p], newState[p])
          }else{
            oldState[p] = newState[p]
          }
        }
      }
      if(!this.state && state){
        this.state = {};
      }
      merge(this.state, state)
      this.update()
      console.log('setstate', this.state);
    }
}
export let ToyReact = {
  createElement (type, attributes, ...children) {
    let element
    if(typeof type === "string"){
      element = new ElementWrapper(type)
    }else{
      element = new type

    }
    // let element = document.createElement(type);
    for (let name in attributes) {
      element.setAttribute(name, attributes[name]);
    }
    let insertChildren = (children) => {
      for (let child of children) {
        if (typeof child === 'object' && child instanceof Array){
            insertChildren(child)
        }else{
          if(!(child instanceof Component)
            && !(child instanceof ElementWrapper)
            && !(child instanceof TextWrapper))
            child = String(child)
          if (typeof child === 'string') {
            // child = document.createTextNode(child);
            child = new TextWrapper(child)
          }
          element.appendChild(child)
        }
        // element.appendChild(child);
      }
    }
    insertChildren(children)
    // debugger; 
    return element;
  },
  render(vdom, element){
    let range = document.createRange()
    if(element.children.length){
      range.setStartAfter(element.lastChild)
      range.setEndAfter(element.lastChild)
    }else{
      range.setStartAfter(element, 0)
      range.setEndAfter(element, 0)
    }
    vdom.mountTo(range)
  }
}

// ElementWrapper 和 Component 的区别