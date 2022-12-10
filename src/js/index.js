import '../styles/main.scss';

export class Editor {

  constructor(container) {
    this.container = container;
    this.callbacks = [];
  }

  on(eventName, callback) {
    this.callbacks[eventName] = callback;
  }

  getNodes() {
    var nodes = [];
    var elemts = this.container.querySelectorAll('.drawgraph-node');
    for (var i = 0; i < elemts.length; i++) {
      const currentElem = elemts[i];
      nodes.push(this.elementNodeToData(currentElem));
    }
    return nodes;
  }
  getNode(id) {
    var elemt = this.container.querySelector('.drawgraph-node[data-id="' + id + '"]');
    if (elemt) {
      return this.elementNodeToData(elemt);
    }
    return null;
  }
  elementNodeToData(currentElem) {
    const inputs = Array.from(currentElem.querySelectorAll('.input')).map(n => {
      return {
        name: n.getAttribute('data-input'),
        maxEdges: +n.getAttribute('data-max-edges')
      };
    });
    const outputs = Array.from(currentElem.querySelectorAll('.output')).map(n => {
      return {
        name: n.getAttribute('data-output'),
        maxEdges: +n.getAttribute('data-max-edges')
      };
    });
    return {
      id: currentElem.getAttribute('data-id'),
      data: JSON.parse(currentElem.getAttribute('data-data')),
      title: currentElem.querySelector('.title').innerText,
      inputs, outputs,
      x: currentElem.offsetLeft,
      y: currentElem.offsetTop
    };
  }
  addNode(title, inputs, outputs, data, initalX = 0, initalY = 0) {
    const nodeId = uuid();
    const elemNode = document.createElement("div");
    elemNode.classList.add('drawgraph-node');
    elemNode.setAttribute('data-id', nodeId);
    elemNode.setAttribute('data-data', JSON.stringify(data));
    elemNode.style.left = initalX + "px";
    elemNode.style.top = initalY + "px";

    // add node title
    var elemTitle = document.createElement("div");
    elemTitle.classList.add('title');
    elemTitle.innerText = title;
    elemTitle.ondblclick = function(e) {
      e = e || window.event;
      e.preventDefault();
      this.removeNode(nodeId);
    }.bind(this);  
    elemNode.appendChild(elemTitle);

    // make dragable
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0, dragged = false;
    elemTitle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
      dragged = false;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      dragged = true;
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      // set the element's new position:
      elemNode.style.left = (elemNode.offsetLeft - pos1) + "px";
      elemNode.style.top = (elemNode.offsetTop - pos2) + "px";

      // move all edges
      const nodeId = elemNode.getAttribute('data-id');
      const inputConnections = document.querySelectorAll('.drawgraph-edge[data-input-node="' + nodeId + '"]');
      for (var i = 0; i < inputConnections.length; i++) {
        const line = inputConnections[i].getElementsByTagName('line')[0];
        line.setAttribute('x1', +line.getAttribute('x1') - pos1);
        line.setAttribute('y1', +line.getAttribute('y1') - pos2);
      }
      const outputConnections = document.querySelectorAll('.drawgraph-edge[data-output-node="' + nodeId + '"]');
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

    // add callback
    elemNode.onclick = function(e) {
      if (!dragged && this.callbacks['nodeClicked'] && e.detail === 1) {
        this.callbacks['nodeClicked'](this.getNode(nodeId));
      }
    }.bind(this);
 

    var elemContainer = document.createElement("div");
    elemContainer.classList.add('container');

    var elemInputs = document.createElement("div");
    elemInputs.classList.add('inputs');
    elemContainer.appendChild(elemInputs);

    var elemContent = document.createElement("div");
    elemContent.classList.add('content');
    elemContainer.appendChild(elemContent);
    
    var elemOutputs = document.createElement("div");
    elemOutputs.classList.add('outputs');
    elemContainer.appendChild(elemOutputs);

    elemNode.appendChild(elemContainer);
    this.container.appendChild(elemNode);

    // add inputs
    for (var i = 0; i < inputs.length; i++) {
      this.addNodeInput(nodeId, inputs[i]);
    }
    // add outputs
    for (var i = 0; i < outputs.length; i++) {
      this.addNodeOutput(nodeId, outputs[i]);
    }
    return nodeId;
  }
  removeNode(node) {
    const nodes = this.container.querySelectorAll('.drawgraph-node[data-id="' + node + '"]')
    if (nodes.length > 0) {
      const data = this.elementNodeToData(nodes[0]);
      // remove node
      this.container.removeChild(nodes[0]);
      // remove all edges
      const edges = [...this.container.querySelectorAll('.drawgraph-edge[data-input-node="' + node + '"]'), ...this.container.querySelectorAll('.drawgraph-edge[data-output-node="' + node + '"]')]
      for (var i = 0; i < edges.length; i++) {
        this.container.removeChild(edges[i]);
      }
      if (this.callbacks['nodeRemoved']) {
        this.callbacks['nodeRemoved'](data);
      }
    }
  }

  addNodeInput(node, input) {
    var elemInputs = this.container.querySelector('.drawgraph-node[data-id="' + node + '"] .inputs');
    
    var elemInput = document.createElement("div");
    elemInput.classList.add('input');
    elemInput.setAttribute('data-input', input.name);
    if (input.maxEdges) {
      elemInput.setAttribute('data-max-edges', input.maxEdges);
    }
    var elemLabel = document.createElement("span");
    elemLabel.innerText = input.name;
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
    this.alignEdges(node);
  }
  removeNodeInput(node, input) {
    var elem = this.container.querySelector('.drawgraph-node[data-id="' + node + '"] .inputs');
    if (!elem) {
      return;
    }
    var elemInput = elem.querySelector('.input[data-input="' + input + '"');
    if (!elemInput) {
      return;
    }
    // remove all edges
    const edges = Array.from(this.container.querySelectorAll('.drawgraph-edge[data-output-node="' + node + '"][data-output="' + input + '"]'));
    for (var i = 0; i < edges.length; i++) {
      this.container.removeChild(edges[i]);
    }
    elem.removeChild(elemInput);
    this.alignEdges(node);
  }
  addNodeOutput(node, output) {
    var elemOutputs = this.container.querySelector('.drawgraph-node[data-id="' + node + '"] .outputs');
    
    var elemOutput = document.createElement("div");
    elemOutput.classList.add('output');
    elemOutput.setAttribute('data-output', output.name);
    if (output.maxEdges) {
      elemOutput.setAttribute('data-max-edges', output.maxEdges);
    }
    var elemLabel = document.createElement("span");
    elemLabel.innerText = output.name;
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

      var startX = e.clientX + window.scrollX - this.container.offsetLeft;
      var startY = e.clientY + window.scrollY - this.container.offsetTop;
      // create new svg elem
      var lineContainer = document.createElementNS('http://www.w3.org/2000/svg',"svg");
      lineContainer.classList.add('drawgraph-edge');
      lineContainer.setAttribute('data-input', outputId);
      lineContainer.setAttribute('data-input-node', nodeId);
      lineContainer.id = 'drawgraph-edge-current'
      var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
      const elemFromOutput = e.target;
      const elemFromNode = e.target.parentNode.parentNode.parentNode;

      newLine.setAttribute('x1',elemFromNode.offsetLeft + elemFromOutput.offsetLeft + elemFromOutput.getBoundingClientRect().width / 2);
      newLine.setAttribute('y1',elemFromNode.offsetTop + elemFromOutput.offsetTop + elemFromOutput.getBoundingClientRect().height / 2);
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
        line.setAttribute('x2',e.clientX + window.scrollX - this.container.offsetLeft);
        line.setAttribute('y2',e.clientY + window.scrollY - this.container.offsetTop);
      }.bind(this);
    }.bind(this);
    elemOutputs.appendChild(elemOutput);
    this.alignEdges(node);
  }
  removeNodeOutput(node, output) {
    var elem = this.container.querySelector('.drawgraph-node[data-id="' + node + '"] .outputs');
    if (!elem) {
      return;
    }
    var elemOutput = elem.querySelector('.output[data-output="' + output + '"');
    if (!elemOutput) {
      return;
    }
    // remove all edges
    const edges = Array.from(this.container.querySelectorAll('.drawgraph-edge[data-input-node="' + node + '"][data-input="' + output + '"]'));
    for (var i = 0; i < edges.length; i++) {
      this.container.removeChild(edges[i]);
    }
    elem.removeChild(elemOutput);
    this.alignEdges(node);
  }

  getEdges() {
    var edges = [];
    var elemts = this.container.querySelectorAll('.drawgraph-edge');
    for (var i = 0; i < elemts.length; i++) {
      edges.push(this.elementEdgeToData(elemts[i]));
    }
    return edges;
  }
  elementEdgeToData(currentElem) {
    return {
      input: {
        node: currentElem.getAttribute('data-input-node'),
        name: currentElem.getAttribute('data-input')
      },
      output: {
        node: currentElem.getAttribute('data-output-node'),
        name: currentElem.getAttribute('data-output')
      }
    };
  }
  addEdge(from, fromOutput, to, toInput) {
    var lineContainer = document.createElementNS('http://www.w3.org/2000/svg',"svg");
    lineContainer.classList.add('drawgraph-edge');
    lineContainer.setAttribute('data-input', fromOutput);
    lineContainer.setAttribute('data-input-node', from);
    lineContainer.setAttribute('data-output', toInput);
    lineContainer.setAttribute('data-output-node', to);
    var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');

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

    this.alignEdge(newLine, from, fromOutput, to, toInput);
    lineContainer.appendChild(newLine);
    this.container.appendChild(lineContainer);
    if (this.callbacks['edgeAdded']) {
      this.callbacks['edgeAdded'](this.elementEdgeToData(lineContainer));
    }
  }
  removeEdge(from, fromOutput, to, toInput) {
    const edge = this.container.querySelectorAll('.drawgraph-edge[data-input-node="' + from + '"][data-input="' + fromOutput + '"][data-output-node="' + to + '"][data-output="' + toInput + '"]')
    if (edge.length > 0) {
      const data = this.elementEdgeToData(edge[0]);
      this.container.removeChild(edge[0]);
      if (this.callbacks['edgeRemoved']) {
        this.callbacks['edgeRemoved'](data);
      }
    }
  }
  alignEdge(line, from, fromOutput, to, toInput) {
    const elemFromNode = this.container.querySelector('[data-id="' + from + '"]');
    const elemFromOutput = elemFromNode.querySelector('[data-output="' + fromOutput + '"]');
    const elemToNode = this.container.querySelector('[data-id="' + to + '"]');
    const elemToInput = elemToNode.querySelector('[data-input="' + toInput + '"]');
    line.setAttribute('x1',elemFromNode.offsetLeft + elemFromOutput.offsetLeft + elemFromOutput.getBoundingClientRect().width / 2);
    line.setAttribute('y1',elemFromNode.offsetTop + elemFromOutput.offsetTop + elemFromOutput.getBoundingClientRect().height / 2);
    line.setAttribute('x2',elemToNode.offsetLeft + elemToInput.offsetLeft + elemToInput.getBoundingClientRect().width / 2);
    line.setAttribute('y2',elemToNode.offsetTop + elemToInput.offsetTop + elemToInput.getBoundingClientRect().height / 2);
  }
  alignEdges(node) {
    const outputConnections = document.querySelectorAll('.drawgraph-edge[data-output-node="' + node + '"]');
    for (var i = 0; i < outputConnections.length; i++) {
      this.alignEdge(outputConnections[i].querySelector('line'),
        outputConnections[i].getAttribute('data-input-node'),
        outputConnections[i].getAttribute('data-input'), 
        outputConnections[i].getAttribute('data-output-node'),
        outputConnections[i].getAttribute('data-output'));
    }
    const inputConnections = document.querySelectorAll('.drawgraph-edge[data-input-node="' + node + '"]');
    for (var i = 0; i < inputConnections.length; i++) {
      this.alignEdge(inputConnections[i].querySelector('line'),
        inputConnections[i].getAttribute('data-input-node'),
        inputConnections[i].getAttribute('data-input'), 
        inputConnections[i].getAttribute('data-output-node'),
        inputConnections[i].getAttribute('data-output'));
    }
  }

}

function uuid() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}