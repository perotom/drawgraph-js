import '../styles/main.scss';

export class Editor {

  constructor(container) {
    this.container = container;
    this.nodes = [];
  }

  start () {
    console.info("Start Drawgraph!!");
  }

  addNode() {
    var elemNode = document.createElement("div");
    elemNode.classList.add('drawgraph-node');
    this.nodes.push(new Node(uuid()));


    var elemTitle = document.createElement("div");
    elemTitle.classList.add('title');
    elemTitle.innerText = "Test";
    elemNode.appendChild(elemTitle);

    var elemContainer = document.createElement("div");
    elemContainer.classList.add('container');

    var elemInputs = document.createElement("div");
    elemInputs.classList.add('inputs');
    for (var i = 0; i < 3; i++) {
      var elemInput = document.createElement("div");
      elemInput.classList.add('input');
      var elemLabel = document.createElement("span");
      elemLabel.innerText = 'Hello world this is a long test' + i;
      elemInput.appendChild(elemLabel);
      elemInputs.appendChild(elemInput);
    }
    elemContainer.appendChild(elemInputs);

    var elemContent = document.createElement("div");
    elemContent.classList.add('content');
    elemContainer.appendChild(elemContent);

    var elemOutputs = document.createElement("div");
    elemOutputs.classList.add('outputs');
    for (var i = 0; i < 4; i++) {
      var elemOutput = document.createElement("div");
      elemOutput.classList.add('output');
      var elemLabel = document.createElement("span");
      elemLabel.innerText = 'IN' + i;
      elemOutput.appendChild(elemLabel);
      elemOutputs.appendChild(elemOutput);
    }
    elemContainer.appendChild(elemOutputs);
    elemNode.appendChild(elemContainer);
    

    dragElement(elemNode, 1); // make dragable
    this.container.appendChild(elemNode);
  }

}

export class Node {
  constructor(id) {
    this.id = id;
  }
}

function uuid() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

function dragElement(elmnt, snapSize = 1) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  elmnt.onmousedown = dragMouseDown;

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
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}