import '../styles/main.scss';

export class Editor {

  constructor(container) {
    this.container = container;
    this.nodes = [];
  }

  start () {
    console.info("Start Drawgraph!!");
  }

  addNode(title, inputs, outputs) {
    var newNode = new Node(title, inputs, outputs);
    this.nodes.push(newNode);
    this.addNodeDOM(newNode);
  }
  addNodeDOM(node) {
    console.log(node.inputs);
    console.log(node.outputs);

    var elemNode = document.createElement("div");
    elemNode.classList.add('drawgraph-node');

    var elemTitle = document.createElement("div");
    elemTitle.classList.add('title');
    elemTitle.innerText = node.title;
    elemNode.appendChild(elemTitle);

    var elemContainer = document.createElement("div");
    elemContainer.classList.add('container');
    // inputs
    var elemInputs = document.createElement("div");
    elemInputs.classList.add('inputs');
    for (var i = 0; i < node.inputs.length; i++) {
      var elemInput = document.createElement("div");
      elemInput.classList.add('input');
      elemInput.classList.add('input_' + i);
      var elemLabel = document.createElement("span");
      elemLabel.innerText = node.inputs[i].name;
      elemInput.appendChild(elemLabel);
      elemInput.onmouseup = function(e) {
        e = e || window.event;
        e.preventDefault();
        const inputBox = e.target.getBoundingClientRect();
        var line = document.getElementById('drawgraph-edge-current').getElementsByTagName('line')[0];
        line.setAttribute('x2',inputBox.x + inputBox.width / 2);
        line.setAttribute('y2',inputBox.y - inputBox.height / 2);
        document.getElementById('drawgraph-edge-current').removeAttribute('id');
      }.bind(this);
      elemInputs.appendChild(elemInput);
    }
    elemContainer.appendChild(elemInputs);
    // content
    var elemContent = document.createElement("div");
    elemContent.classList.add('content');
    elemContainer.appendChild(elemContent);
    // outputs
    var elemOutputs = document.createElement("div");
    elemOutputs.classList.add('outputs');
    for (var i = 0; i < node.outputs.length; i++) {
      var elemOutput = document.createElement("div");
      elemOutput.classList.add('output');
      elemOutput.classList.add('output_' + i);
      var elemLabel = document.createElement("span");
      elemLabel.innerText = node.outputs[i].name;
      elemOutput.appendChild(elemLabel);
      // on draw new connection
      elemOutput.onmousedown = function(e) {
        e = e || window.event;
        e.preventDefault();
        var startX = e.clientX - this.container.offsetLeft;
        var startY = e.clientY - this.container.offsetTop;
        // create new svg elem
        var lineContainer = document.createElementNS('http://www.w3.org/2000/svg',"svg");
        lineContainer.classList.add('drawgraph-edge');
        lineContainer.classList.add('node_out_' + i);
        lineContainer.id = 'drawgraph-edge-current'
        var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
        console.log(e.target.classList);
        const outputBox = e.target.getBoundingClientRect();
        newLine.setAttribute('x1',outputBox.x + outputBox.width / 2);
        newLine.setAttribute('y1',outputBox.y - outputBox.height / 2);
        newLine.setAttribute('x2',startX);
        newLine.setAttribute('y2',startY);
        newLine.setAttribute("stroke", "black");
        newLine.setAttribute("stroke-width", 3);
        lineContainer.appendChild(newLine);
        this.container.appendChild(lineContainer);

        document.onmouseup = function(e) {
          document.onmouseup = null;
          document.onmousemove = null;
          if (document.getElementById('drawgraph-edge-current')) { // might be already removed when connected
            this.container.removeChild(document.getElementById('drawgraph-edge-current'));
          }
        }.bind(this);
        document.onmousemove = function(e) {
          e = e || window.event;
          e.preventDefault();
          var line = document.getElementById('drawgraph-edge-current').getElementsByTagName('line')[0];
          line.setAttribute('x2',e.clientX - this.container.offsetLeft);
          line.setAttribute('y2',e.clientY - this.container.offsetTop);
        }.bind(this);
      }.bind(this);
      elemOutputs.appendChild(elemOutput);
    }
    elemContainer.appendChild(elemOutputs);
    elemNode.appendChild(elemContainer);
    

    dragElement(node, elemNode, 1); // make dragable
    elemNode.style.top = node.x + "px";
    elemNode.style.left = node.y + "px";
    this.container.appendChild(elemNode);
  }

  export() {
    return {
      nodes: this.nodes
    };
  }
  import(data) {
    this.nodes = data.nodes;
    // clear all
    this.container.innerHTML = '';
    // add all nodes
    for (var i = 0; i < this.nodes.length; i++) {
      this.addNodeDOM(this.nodes[i]);
    }
  }

}

export class Node {
  constructor(title, inputs, outputs) {
    this.id = uuid();
    this.title = title;
    this.x = 0;
    this.y = 0;
    this.inputs = inputs;
    this.outputs = outputs;
  }
}

function uuid() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

function dragElement(node, elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (elmnt.querySelector('.title')) {
    elmnt.querySelector('.title').onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    node.x = elmnt.offsetTop - pos2;
    node.y = elmnt.offsetLeft - pos1;
    elmnt.style.top = node.x + "px";
    elmnt.style.left = node.y + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}