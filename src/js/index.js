import '../styles/main.scss';

export class Editor {

  constructor(container) {
    this.container = container;
  }

  start () {
    console.info("Start Drawgraph!!");
  }

  addNode(title, inputs, outputs, initalX = 0, initalY = 0) {
    const nodeId = uuid();
    const elemNode = document.createElement("div");
    elemNode.classList.add('drawgraph-node');
    elemNode.setAttribute('data-id', nodeId);
    elemNode.style.left = initalX + "px";
    elemNode.style.top = initalY + "px";

    var elemTitle = document.createElement("div");
    elemTitle.classList.add('title');
    elemTitle.innerText = title;
    elemTitle.ondblclick = function(e) {
      e = e || window.event;
      e.preventDefault();
      this.removeNode(nodeId);
    }.bind(this);  
    elemNode.appendChild(elemTitle);

    var elemContainer = document.createElement("div");
    elemContainer.classList.add('container');
    // inputs
    var elemInputs = document.createElement("div");
    elemInputs.classList.add('inputs');
    for (var i = 0; i < inputs.length; i++) {
      var elemInput = document.createElement("div");
      elemInput.classList.add('input');
      elemInput.setAttribute('data-input', inputs[i].name);
      if (inputs[i].maxEdges) {
        elemInput.setAttribute('data-max-edges', inputs[i].maxEdges);
      }
      var elemLabel = document.createElement("span");
      elemLabel.innerText = inputs[i].name;
      elemInput.appendChild(elemLabel);
      elemInput.onmouseup = function(e) {
        e = e || window.event;
        e.preventDefault();

        const currentEdge = document.getElementById('drawgraph-edge-current');
        if (!currentEdge) { // no current edge was draw, could be because of max edges in output node
          return;
        }

        // check max edges
        const maxEdges = e.target.getAttribute('data-max-edges');
        const nodeId = e.target.parentNode.parentNode.parentNode.getAttribute('data-id');
        const inputId = e.target.getAttribute('data-input');
        if (maxEdges && this.container.querySelectorAll('.drawgraph-edge[data-output-node="' + nodeId + '"][data-output="' + inputId + '"]').length >= maxEdges) {
          console.trace('Max edges');
          return;
        }

        // check duplicate
        const edgeInputNode = currentEdge.getAttribute('data-input-node');
        const edgeInput = currentEdge.getAttribute('data-input');
        if (this.container.querySelectorAll('.drawgraph-edge[data-output-node="' + nodeId + '"][data-output="' + inputId + '"][data-input-node="' + edgeInputNode + '"][data-input="' + edgeInput + '"]').length > 0) {
          console.trace('Duplicate');
          return;
        }

        // convert current edge to proper
        this.addEdge(edgeInputNode, edgeInput, nodeId, inputId);
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
    for (var i = 0; i < outputs.length; i++) {
      var elemOutput = document.createElement("div");
      elemOutput.classList.add('output');
      elemOutput.setAttribute('data-output', outputs[i].name);
      if (outputs[i].maxEdges) {
        elemOutput.setAttribute('data-max-edges', outputs[i].maxEdges);
      }
      var elemLabel = document.createElement("span");
      elemLabel.innerText = outputs[i].name;
      elemOutput.appendChild(elemLabel);
      // on draw new edge
      elemOutput.onmousedown = function(e) {
        e = e || window.event;
        e.preventDefault();
        
        // check max edges
        const maxEdges = e.target.getAttribute('data-max-edges');
        const nodeId = e.target.parentNode.parentNode.parentNode.getAttribute('data-id');
        const outputId = e.target.getAttribute('data-output');
        if (maxEdges && this.container.querySelectorAll('.drawgraph-edge[data-input-node="' + nodeId + '"][data-input="' + outputId + '"]').length >= maxEdges) {
          console.trace('Max edges');
          return;
        }

        var startX = e.clientX - this.container.offsetLeft;
        var startY = e.clientY - this.container.offsetTop;
        // create new svg elem
        var lineContainer = document.createElementNS('http://www.w3.org/2000/svg',"svg");
        lineContainer.classList.add('drawgraph-edge');
        lineContainer.setAttribute('data-input', outputId);
        lineContainer.setAttribute('data-input-node', nodeId);
        lineContainer.id = 'drawgraph-edge-current'
        var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
        const outputBox = e.target.getBoundingClientRect();
        newLine.setAttribute('x1',outputBox.x + outputBox.width / 2);
        newLine.setAttribute('y1',outputBox.y - outputBox.height / 2);
        newLine.setAttribute('x2',startX);
        newLine.setAttribute('y2',startY);
        lineContainer.appendChild(newLine);
        this.container.appendChild(lineContainer);

        document.onmouseup = function(e) {
          document.onmouseup = null;
          document.onmousemove = null;
          this.container.removeChild(document.getElementById('drawgraph-edge-current'))
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
    
    dragElement(elemNode, 1); // make dragable
    this.container.appendChild(elemNode);
    return nodeId;
  }
  removeNode(node) {
    const nodes = this.container.querySelectorAll('.drawgraph-node[data-id="' + node + '"]')
    if (nodes.length > 0) {
      // remove node
      this.container.removeChild(nodes[0]);
      // remove all edges
      const edges = [...this.container.querySelectorAll('.drawgraph-edge[data-input-node="' + node + '"]'), ...this.container.querySelectorAll('.drawgraph-edge[data-output-node="' + node + '"]')]
      for (var i = 0; i < edges.length; i++) {
        this.container.removeChild(edges[i]);
      }
    }
  }

  addEdge(from, fromOutput, to, toInput) {
    var lineContainer = document.createElementNS('http://www.w3.org/2000/svg',"svg");
    lineContainer.classList.add('drawgraph-edge');
    lineContainer.setAttribute('data-input', fromOutput);
    lineContainer.setAttribute('data-input-node', from);
    lineContainer.setAttribute('data-output', toInput);
    lineContainer.setAttribute('data-output-node', to);
    var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
    const elemFromNode = this.container.querySelector('[data-id="' + from + '"]');
    const elemFromOutput = elemFromNode.querySelector('[data-output="' + fromOutput + '"]');
    const elemToNode = this.container.querySelector('[data-id="' + to + '"]');
    const elemToInput = elemToNode.querySelector('[data-input="' + toInput + '"]');
    if (!elemFromNode || !elemFromOutput || !elemToNode || !elemToInput) {
      console.trace('Node or edge not found');
      return;
    }

    newLine.ondblclick = function(e) {
      e = e || window.event;
      e.preventDefault();
      this.removeEdge(
        e.target.parentNode.getAttribute('data-input-node'),
        e.target.parentNode.getAttribute('data-input'),
        e.target.parentNode.getAttribute('data-output-node'),
        e.target.parentNode.getAttribute('data-output')
      );
    }.bind(this);  

    newLine.setAttribute('x1',this.container.offsetLeft + elemFromNode.offsetLeft + elemFromOutput.offsetLeft + elemFromOutput.getBoundingClientRect().width / 2);
    newLine.setAttribute('y1',this.container.offsetTop + elemFromNode.offsetTop + elemFromOutput.offsetTop - elemFromOutput.getBoundingClientRect().height / 2);
    newLine.setAttribute('x2',this.container.offsetLeft + elemToNode.offsetLeft + elemToInput.offsetLeft + elemToInput.getBoundingClientRect().width / 2);
    newLine.setAttribute('y2',this.container.offsetTop + elemToNode.offsetTop + elemToInput.offsetTop - elemToInput.getBoundingClientRect().height / 2);
    lineContainer.appendChild(newLine);
    this.container.appendChild(lineContainer);
  }
  removeEdge(from, fromOutput, to, toInput) {
    const edge = this.container.querySelectorAll('.drawgraph-edge[data-input-node="' + from + '"][data-input="' + fromOutput + '"][data-output-node="' + to + '"][data-output="' + toInput + '"]')
    if (edge.length > 0) {
      this.container.removeChild(edge[0]);
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

function dragElement(elmnt) {
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
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";

    // move all edges
    const nodeId = elmnt.getAttribute('data-id');
    const inputConnections = document.querySelectorAll('[data-input-node="' + nodeId + '"]');
    for (var i = 0; i < inputConnections.length; i++) {
      const line = inputConnections[i].getElementsByTagName('line')[0];
      line.setAttribute('x1', +line.getAttribute('x1') - pos1);
      line.setAttribute('y1', +line.getAttribute('y1') - pos2);
    }
    const outputConnections = document.querySelectorAll('[data-output-node="' + nodeId + '"]');
    for (var i = 0; i < outputConnections.length; i++) {
      const line = outputConnections[i].getElementsByTagName('line')[0];
      line.setAttribute('x2', +line.getAttribute('x2') - pos1);
      line.setAttribute('y2', +line.getAttribute('y2') - pos2);
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}