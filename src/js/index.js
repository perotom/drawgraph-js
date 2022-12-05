import '../styles/main.scss';

export class Editor {
  constructor(container) {
    this.container = container;
    this.node = new Node(uuid());
  }

  start () {
    console.info("Start Drawgraph!!");
  }

  addNode() {
    
  }

}

export class Node {
  constructor(title) {
    this.title = title;
    console.log(this.title);
  }
}

function uuid() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

