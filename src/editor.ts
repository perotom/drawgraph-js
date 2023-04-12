const { v4: uuidv4 } = require('uuid');

export type Node = {
    id: string | null,
	data: any | null,
	title: string,
	inputs: NodePort[], 
	outputs: NodePort[],
	x: number,
	y: number
};

export type NodePort = {
    name: string,
	maxEdges: number,
	renameable: boolean
};

export type Edge = {
    input: EdgePort,
	output: EdgePort
};

export type EdgePort = {
    node: string,
	name: string
};

export default class Editor {
	
	container: HTMLElement;
	public onNodeClicked?: (node: Node) => void;
	public onNodeRemoved?: (node: Node) => void;
	public onEdgeAdded?: (edge: Edge) => void;
	public onEdgeRemoved?: (edge: Edge) => void;

	constructor(container: HTMLElement) {
		this.container = container;

		var lastX: number, lastY: number;
		this.container.onmousedown = (e: MouseEvent) => {
			if (e.button != 0) {
				return;
			}
			if (e.target !== this.container) {
				return;
			}

			// get the mouse cursor position at startup:
			lastX = e.clientX;
			lastY = e.clientY;
			document.onmouseup = (e: MouseEvent) => {
				document.onmouseup = null;
				this.container.onmousemove = null;
			}
			this.container.onmousemove = (e: MouseEvent) => {
				// move all nodes
				const nodes = this.container.querySelectorAll<HTMLElement>(".drawgraph-node");
				for (var i = 0; i < nodes.length; i++) {
					const elemNode = nodes[i];
					elemNode.style.left = (+elemNode.style.left.replace('px', '') + (e.clientX - lastX)) + "px";
					elemNode.style.top = (+elemNode.style.top.replace('px', '') + (e.clientY - lastY)) + "px";
				}
				// move all edges
				const edges = this.container.querySelectorAll<HTMLElement>(".drawgraph-edge line");
				for (var i = 0; i < edges.length; i++) {
					const elemEdge = edges[i];
					elemEdge.setAttribute('x1', String(+(elemEdge.getAttribute('x1') ?? 0) + (e.clientX - lastX)));
					elemEdge.setAttribute('y1', String(+(elemEdge.getAttribute('y1') ?? 0) + (e.clientY - lastY)));
					elemEdge.setAttribute('x2', String(+(elemEdge.getAttribute('x2') ?? 0) + (e.clientX - lastX)));
					elemEdge.setAttribute('y2', String(+(elemEdge.getAttribute('y2') ?? 0) + (e.clientY - lastY)));
				}
				lastX = e.clientX;
				lastY = e.clientY;
			}
		}
	}

	// node functions
	getNodes(): Node[] {
		var nodes: Node[] = [];
		var elemts = this.container.querySelectorAll<HTMLElement>(".drawgraph-node");
		for (var i = 0; i < elemts.length; i++) {
			const currentElem = elemts[i];
			nodes.push(this.elementNodeToData(currentElem));
		}
		return nodes;
	}
	getNode(id: string): Node | null {
		var elemt = this.container.querySelector<HTMLElement>(".drawgraph-node[data-id='" + id + "']");
		if (elemt) {
			return this.elementNodeToData(elemt);
		}
		return null;
	}
	private elementNodeToData(currentElem: HTMLElement): Node {
		const inputs = Array.from(currentElem.querySelectorAll(".input")).map(n => {
			return {
				name: n.getAttribute('data-input')!,
				maxEdges: +(n.getAttribute('data-max-edges') ?? 0)
			} as NodePort;
		});
		const outputs = Array.from(currentElem.querySelectorAll(".output")).map(n => {
			return {
				name: n.getAttribute('data-output')!,
				maxEdges: +(n.getAttribute('data-max-edges') ?? 0)
			} as NodePort;
		});
		return {
			id: currentElem.getAttribute('data-id'),
			data: currentElem.getAttribute('data-data') ? JSON.parse(currentElem.getAttribute('data-data') || '') : null,
			title: currentElem.querySelector<HTMLElement>(".title")?.innerText!,
			inputs, outputs,
			x: currentElem.offsetLeft,
			y: currentElem.offsetTop
		};
	}
	addNode(node: Node, initalX = 0, initalY = 0, removeable = true) {
		const nodeId = (node.id) ? node.id : uuidv4();
		const elemNode = document.createElement("div");
		elemNode.classList.add('drawgraph-node');
		elemNode.setAttribute('data-id', nodeId);
		if (node.data) {
			elemNode.setAttribute('data-data', JSON.stringify(node.data));
		}
		elemNode.style.left = initalX + "px";
		elemNode.style.top = initalY + "px";
	
		// add node title
		var elemTitle = document.createElement("div");
		elemTitle.classList.add('title');
		elemTitle.innerText = node.title;
		if (removeable) {
		  elemTitle.ondblclick = (e: MouseEvent) => {
			this.removeNode(nodeId);
		  };  
		}
		elemNode.appendChild(elemTitle);
	
		// make dragable
		var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0, dragged = false;
		elemTitle.onmousedown = (e: MouseEvent) => {
			if (e.button != 0) {
				return;
			}
			// get the mouse cursor position at startup:
			pos3 = e.clientX;
			pos4 = e.clientY;
			document.onmouseup = (e: MouseEvent) => {
				// stop moving when mouse button is released:
				document.onmouseup = null;
				this.container.onmousemove = null;
			};
			// call a function whenever the cursor moves:
			this.container.onmousemove = (e: MouseEvent) => {
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
				const inputConnections = this.container.querySelectorAll(".drawgraph-edge[data-input-node='" + nodeId + "']");
				for (var i = 0; i < inputConnections.length; i++) {
				const line = inputConnections[i].getElementsByTagName('line')[0];
				line.setAttribute('x1', String(+(line.getAttribute('x1') ?? 0) - pos1));
				line.setAttribute('y1', String(+(line.getAttribute('y1') ?? 0) - pos2));
				}
				const outputConnections = this.container.querySelectorAll(".drawgraph-edge[data-output-node='" + nodeId + "']");
				for (var i = 0; i < outputConnections.length; i++) {
				const line = outputConnections[i].getElementsByTagName('line')[0];
				line.setAttribute('x2', String(+(line.getAttribute('x2') ?? 0) - pos1));
				line.setAttribute('y2', String(+(line.getAttribute('y2') ?? 0) - pos2));
				}
			};
			dragged = false;
		};
	
		// add callback
		elemNode.onclick = (e: MouseEvent) => {
			if (!dragged && e.button === 0) {
				const selectedNodes = this.container.querySelectorAll(".drawgraph-node.selected");
				for (var i = 0; i < selectedNodes.length; i++) {
					selectedNodes[i].classList.remove('selected');
				}
				this.container.querySelector(".drawgraph-node[data-id='" + nodeId + "']")?.classList.add('selected');

				if (this.onNodeClicked) {
					this.onNodeClicked(this.getNode(nodeId)!);
				}
			}
		};
	 
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
		for (var i = 0; i < node.inputs.length; i++) {
		  this.addNodeInput(nodeId, node.inputs[i]);
		}
		// add outputs
		for (var i = 0; i < node.outputs.length; i++) {
		  this.addNodeOutput(nodeId, node.outputs[i]);
		}
		return nodeId;
	}
	updateNodeData(id: string, data: any) {
		var elemt = this.container.querySelector(".drawgraph-node[data-id='" + id + "']");
		if (elemt) {
			elemt.setAttribute('data-data', JSON.stringify(data));
		}
	}
	removeNode(node: string) {
		const nodes = this.container.querySelectorAll<HTMLElement>(".drawgraph-node[data-id='" + node + "']")
		if (nodes.length > 0) {
			const data = this.elementNodeToData(nodes[0]);
			// remove node
			this.container.removeChild(nodes[0]);
			// remove all edges
			const edges = this.container.querySelectorAll(".drawgraph-edge[data-input-node='" + node + "'], .drawgraph-edge[data-output-node='" + node + "']");
			for (var i = 0; i < edges.length; i++) {
				this.removeEdge(
					edges[i].getAttribute('data-input-node')!,
					edges[i].getAttribute('data-input')!,
					edges[i].getAttribute('data-output-node')!,
					edges[i].getAttribute('data-output')!
				);
			}

			if (this.onNodeRemoved) {
				this.onNodeRemoved(data);
			}
		}
	}
	
	// in/output functions
	addNodeInput(node: string, input: NodePort) {
		var elemInputs = this.container.querySelector(".drawgraph-node[data-id='" + node + "'] .inputs");

		var elemInput = document.createElement("div");
		elemInput.classList.add('input');
		elemInput.setAttribute('data-input', input.name);
		if (input.maxEdges) {
			elemInput.setAttribute('data-max-edges', String(input.maxEdges));
		}
		var elemLabel = document.createElement("span");
		elemLabel.innerText = input.name;
		if (input.renameable) {
			elemLabel.ondblclick = (e: MouseEvent) => {
				console.log('rename');
			};
		}

		elemInput.appendChild(elemLabel);
		elemInput.onmouseup = (e: MouseEvent) => {
			const currentEdge = this.container.querySelector("#drawgraph-edge-current");
			if (!currentEdge) { // no current edge was draw, could be because of max edges in output node
				return;
			}
			
			// check max edges
			const target = e.target as Element;
			const maxEdges = +(target.getAttribute('data-max-edges') ?? 0);
			const nodeId = target.parentElement?.parentElement?.parentElement?.getAttribute('data-id');
			const inputId = target.getAttribute('data-input');
			if (maxEdges && this.container.querySelectorAll(".drawgraph-edge[data-output-node='" + nodeId + "'][data-output='" + inputId + "']").length >= maxEdges) {
				console.trace('Max edges');
				return;
			}

			// check duplicate
			const edgeInputNode = currentEdge.getAttribute('data-input-node');
			const edgeInput = currentEdge.getAttribute('data-input');
			if (this.container.querySelectorAll(".drawgraph-edge[data-output-node='" + nodeId + "'][data-output='" + inputId + "'][data-input-node='" + edgeInputNode + "'][data-input='" + edgeInput + "']").length > 0) {
				console.trace('Duplicate');
				return;
			}

			// convert current edge to proper
			this.addEdge(edgeInputNode!, edgeInput!, nodeId!, inputId!);
		};

		elemInputs?.appendChild(elemInput);
		this.alignEdges(node);
	}
	removeNodeInput(node: string, inputId: string) {
		const elem = this.container.querySelector('.drawgraph-node[data-id="' + node + '"] .inputs');
		if (!elem) {
			return;
		}
		const elemInput = elem.querySelector('.input[data-input="' + inputId + '"');
		if (!elemInput) {
			return;
		}
		// remove all edges
		const edges = Array.from(this.container.querySelectorAll('.drawgraph-edge[data-output-node="' + node + '"][data-output="' + inputId + '"]'));
		for (var i = 0; i < edges.length; i++) {
			this.container.removeChild(edges[i]);
		}
		elem.removeChild(elemInput);
		this.alignEdges(node);
	}
	addNodeOutput(node: string, output: NodePort) {
		var elemOutputs = this.container.querySelector(".drawgraph-node[data-id='" + node + "'] .outputs");
		
		var elemOutput = document.createElement("div");
		elemOutput.classList.add('output');
		elemOutput.setAttribute('data-output', output.name);
		if (output.maxEdges) {
			elemOutput.setAttribute('data-max-edges', String(output.maxEdges));
		}
		var elemLabel = document.createElement("span");
		elemLabel.innerText = output.name;
		elemOutput.appendChild(elemLabel);
		if (output.renameable) {
			console.log(elemLabel);
			elemLabel.ondblclick = (e: MouseEvent) => {
				console.log('rename');
			};
		}
		// on draw new edge
		elemOutput.onmousedown = (e: MouseEvent) => {
			if (e.button != 0) {
				return;
			}
			const target = e.target as HTMLElement;
			
			// check max edges
			const maxEdges = +(target.getAttribute('data-max-edges') ?? 0);
			const nodeId = target.parentElement?.parentElement?.parentElement?.getAttribute('data-id');
			const outputId = target.getAttribute('data-output');
			if (maxEdges && this.container.querySelectorAll(".drawgraph-edge[data-input-node='" + nodeId + "'][data-input='" + outputId + "']").length >= maxEdges) {
				console.trace('Max edges');
				return;
			}
			// set all inputs to disabled during dragging
			const nodePortsDisable = Array.from(this.container.querySelectorAll(".drawgraph-node .outputs .output"));
			for (var i = 0; i < nodePortsDisable.length; i++) {
				nodePortsDisable[i].classList.add('disabled');
			}

			// create new svg elem
			var lineContainer = document.createElementNS('http://www.w3.org/2000/svg',"svg");
			lineContainer.classList.add('drawgraph-edge');
			lineContainer.setAttribute('data-input', outputId!);
			lineContainer.setAttribute('data-input-node', nodeId!);
			lineContainer.id = 'drawgraph-edge-current'
			var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
			const elemFromOutput = target;
			elemFromOutput.classList.add('current');
			const elemFromNode = target.parentElement?.parentElement?.parentElement;
			
			newLine.setAttribute('x1', String((elemFromNode?.offsetLeft ?? 0) + elemFromOutput?.offsetLeft + elemFromOutput.getBoundingClientRect().width / 2));
			newLine.setAttribute('y1', String((elemFromNode?.offsetTop ?? 0) + elemFromOutput?.offsetTop + elemFromOutput.getBoundingClientRect().height / 2));
			newLine.setAttribute('x2', String((elemFromNode?.offsetLeft ?? 0) + elemFromOutput?.offsetLeft + elemFromOutput.getBoundingClientRect().width / 2));
			newLine.setAttribute('y2', String((elemFromNode?.offsetTop ?? 0) + elemFromOutput?.offsetTop + elemFromOutput.getBoundingClientRect().height / 2));
			lineContainer.appendChild(newLine);
			this.container.appendChild(lineContainer);

			document.onmouseup = (e: MouseEvent) => {
				document.onmouseup = null;
				this.container.onmousemove = null;
				const currentEdge = this.container.querySelector('#drawgraph-edge-current');
				if (currentEdge) {
					this.container.removeChild(currentEdge);
					elemFromOutput.classList.remove('current');
				}
				const nodePortsDisable = Array.from(this.container.querySelectorAll('.drawgraph-node .disabled'));
				for (var i = 0; i < nodePortsDisable.length; i++) {
					nodePortsDisable[i].classList.remove('disabled');
				}
			};
			this.container.onmousemove = (e: MouseEvent) => {
				var line = this.container.querySelector('#drawgraph-edge-current line');
				var rect = (e as any).currentTarget.getBoundingClientRect();
				line?.setAttribute('x2', String(e.clientX - rect.left));
				line?.setAttribute('y2', String(e.clientY - rect.top));
			};
		};
		elemOutputs?.appendChild(elemOutput);
		this.alignEdges(node);
	}
	removeNodeOutput(nodeId: string, outputId: string) {
		var elem = this.container.querySelector(".drawgraph-node[data-id='" + nodeId + "'] .outputs");
		if (!elem) {
			return;
		}
		var elemOutput = elem.querySelector(".output[data-output='" + outputId + "'");
		if (!elemOutput) {
			return;
		}
		// remove all edges
		const edges = Array.from(this.container.querySelectorAll(".drawgraph-edge[data-input-node='" + nodeId + "'][data-input='" + outputId + "']"));
		for (var i = 0; i < edges.length; i++) {
			this.container.removeChild(edges[i]);
		}
		elem.removeChild(elemOutput);
		this.alignEdges(nodeId);
	}

	// edge functions
	getEdges(): Edge[] {
		var edges: Edge[] = [];
		var elemts = this.container.querySelectorAll('.drawgraph-edge');
		for (var i = 0; i < elemts.length; i++) {
		  edges.push(this.elementEdgeToData(elemts[i]));
		}
		return edges;
	}
	private elementEdgeToData(currentElem: Element): Edge {
		return {
			input: {
				node: currentElem.getAttribute('data-input-node')!,
				name: currentElem.getAttribute('data-input')!
			},
			output: {
				node: currentElem.getAttribute('data-output-node')!,
				name: currentElem.getAttribute('data-output')!
			}
		};
	}
	addEdge(from: string, portOutput: string, to: string, portInput: string) {
		var lineContainer = document.createElementNS('http://www.w3.org/2000/svg',"svg");
		lineContainer.classList.add('drawgraph-edge');
		lineContainer.setAttribute('data-input', portOutput);
		lineContainer.setAttribute('data-input-node', from);
		lineContainer.setAttribute('data-output', portInput);
		lineContainer.setAttribute('data-output-node', to);
		var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');

		newLine.ondblclick = (e: MouseEvent) => {
			const target = e.target as Element;
			this.removeEdge(
				target.parentElement?.getAttribute('data-input-node')!,
				target.parentElement?.getAttribute('data-input')!,
				target.parentElement?.getAttribute('data-output-node')!,
				target.parentElement?.getAttribute('data-output')!
			);
		};  

		this.alignEdge(newLine, from, portOutput, to, portInput);
		lineContainer.appendChild(newLine);
		this.container.appendChild(lineContainer);
		// add class to node ports
		this.container.querySelector(".drawgraph-node[data-id='" + from + "'] .outputs .output[data-output='" + portOutput + "'")?.classList.add('used');
		this.container.querySelector(".drawgraph-node[data-id='" + to + "'] .inputs .input[data-input='" + portInput + "'")?.classList.add('used');

		if (this.onEdgeAdded) {
			this.onEdgeAdded(this.elementEdgeToData(lineContainer));
		}
	}
	removeEdge(from: string, portOutput: string, to: string, portInput: string) {
		const edge = this.container.querySelectorAll(".drawgraph-edge[data-input-node='" + from + "'][data-input='" + portOutput + "'][data-output-node='" + to + "'][data-output='" + portInput + "']");
		if (edge.length > 0) {
			const data = this.elementEdgeToData(edge[0]);
			this.container.removeChild(edge[0]);
			// remove class to node ports
			if (this.container.querySelectorAll(".drawgraph-edge[data-input-node='" + from + "'][data-input='" + portOutput + "']").length == 0) {
				this.container.querySelector(".drawgraph-node[data-id='" + from + "'] .outputs .output[data-output='" + portOutput + "'")?.classList.remove('used');
			}
			if (this.container.querySelectorAll(".drawgraph-edge[data-output-node='" + to + "'][data-output='" + portInput + "']").length == 0) {
				this.container.querySelector(".drawgraph-node[data-id='" + to + "'] .inputs .input[data-input='" + portInput + "'")?.classList.remove('used');
			}
			if (this.onEdgeRemoved) {
				this.onEdgeRemoved(data);
			}
		}
	}
	alignEdge(line: SVGElement, from: string, portOutput: string, to: string, portInput: string) {
		const elemFromNode = this.container.querySelector<HTMLElement>("[data-id='" + from + "']");
		const elemFromOutput = elemFromNode?.querySelector<HTMLElement>("[data-output='" + portOutput + "']");
		const elemToNode = this.container.querySelector<HTMLElement>("[data-id='" + to + "']");
		const elemToInput = elemToNode?.querySelector<HTMLElement>("[data-input='" + portInput + "']");
		line.setAttribute('x1', String((elemFromNode?.offsetLeft ?? 0) + (elemFromOutput?.offsetLeft ?? 0) + (elemFromOutput?.getBoundingClientRect().width ?? 0) / 2));
		line.setAttribute('y1', String((elemFromNode?.offsetTop ?? 0) + (elemFromOutput?.offsetTop ?? 0) + (elemFromOutput?.getBoundingClientRect().height ?? 0) / 2));
		line.setAttribute('x2', String((elemToNode?.offsetLeft ?? 0) + (elemToInput?.offsetLeft ?? 0) + (elemToInput?.getBoundingClientRect().width ?? 0) / 2));
		line.setAttribute('y2', String((elemToNode?.offsetTop ?? 0) + (elemToInput?.offsetTop ?? 0) + (elemToInput?.getBoundingClientRect().height ?? 0) / 2));
	}
	alignEdges(node: string) {
		const outputConnections = this.container.querySelectorAll(".drawgraph-edge[data-output-node='" + node + "']");
		for (var i = 0; i < outputConnections.length; i++) {
			this.alignEdge(outputConnections[i].querySelector<SVGElement>('line')!,
			outputConnections[i].getAttribute('data-input-node')!,
			outputConnections[i].getAttribute('data-input')!, 
			outputConnections[i].getAttribute('data-output-node')!,
			outputConnections[i].getAttribute('data-output')!);
		}
		const inputConnections = this.container.querySelectorAll(".drawgraph-edge[data-input-node='" + node + "']");
		for (var i = 0; i < inputConnections.length; i++) {
			this.alignEdge(inputConnections[i].querySelector<SVGElement>('line')!,
			inputConnections[i].getAttribute('data-input-node')!,
			inputConnections[i].getAttribute('data-input')!, 
			inputConnections[i].getAttribute('data-output-node')!,
			inputConnections[i].getAttribute('data-output')!);
		}
	}

	// utility functions
	clear() {
		this.container.replaceChildren();
	}
	export(): any {
		return {
			nodes: this.getNodes(),
			edges: this.getEdges()
		};
	}
	import(graph: any) {
		this.clear();
		if (graph.nodes) {
			for (var n of graph.nodes) {
				this.addNode(n, n.x, n.y);
			}
		}
		if (graph.edges) {
			for (var e of graph.edges) {
				this.addEdge(e.input.node, e.input.name, e.output.node, e.output.name);
			}
		}
	}

}