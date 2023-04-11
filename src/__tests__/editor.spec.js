import Editor from "../editor";

let mockElement;

beforeAll(() => {
  mockElement = document.createElement("div");
  mockElement.id = 'graph';
  mockElement.classList.add('drawgraph-editor');
});

describe("Editor", () => {
  it("should add node", () => {
    const graph = new Editor(mockElement);

    const n = graph.addNode({
      title: 'Calc',
      inputs: [{ name: 'Latitude', maxEdges: 1}, { name: 'Longitude', maxEdges: 1}],
      outputs: [{ name: 'Distance'}, { name: 'Speed'}, { name: 'test'}, { name: 'test2'}]
    }, 300, 20);

    expect(graph.getNodes().length).toEqual(1);
  });
});
