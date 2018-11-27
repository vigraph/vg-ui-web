import { Graph } from './Graph';
import { Node } from './Node';

it('loads from JSON', () =>
{
  const graph: Graph = new Graph();
  const json =
  {
    nodes: [
      {
        id: 'foo', type: 'bar', x: 1, y: 2, w: 3, h: 4,
        edges: [
          { output: 'out1', dest: 'splat', input: 'in1' }]
      },
      {
        id: 'splat', type: 'wibble'
      }
    ]
  };

  graph.loadFrom(json);

  const foo: Node | null = graph.getNode("foo");
  expect(foo).toBeDefined();
  expect(foo!.type).toBe("bar");
  expect(foo!.position.x).toBe(1);
  expect(foo!.position.y).toBe(2);
  expect(foo!.size.w).toBe(3);
  expect(foo!.size.h).toBe(4);

  const edgesOut = foo!.getForwardEdges();
  const edgeOut = edgesOut.get("out1");
  expect(edgeOut).toBeDefined();
  expect(edgeOut!.dest.id).toBe("splat");
  expect(edgeOut!.destInput).toBe("in1");

  const splat: Node | null = graph.getNode("splat");
  expect(splat).toBeDefined();
  expect(splat!.type).toBe("wibble");
  expect(splat!.position.x).toBe(0);
  expect(splat!.position.y).toBe(0);
  expect(splat!.size.w).toBe(50);
  expect(splat!.size.h).toBe(50);
});

it('adds and retrieves nodes by ID', () =>
{
  const graph: Graph = new Graph();
  graph.addNode("foo", "bar");
  const node: Node | null = graph.getNode("foo");
  expect(node).toBeDefined();
  expect(node!.type).toBe("bar");
});

it('adds and returns Node proxy', () =>
{
  const graph: Graph = new Graph();
  const node: Node = graph.addNode("foo", "bar");
  expect(node).toBeDefined();
  expect(node.type).toBe("bar");
});

it('adds and retrieves node array', () =>
{
  const graph: Graph = new Graph();
  graph.addNode("foo", "bar");
  graph.addNode("splat", "wibble");
  const nodes = graph.getNodes();
  expect(nodes.length).toBe(2);
});

it('sets & retrieves node position', () =>
{
  const graph: Graph = new Graph();
  const node: Node = graph.addNode("foo", "bar");
  node.position = { x: 1, y: 2 };
  expect(node.position.x).toBe(1);
  expect(node.position.y).toBe(2);
});

it('sets & retrieves node size', () =>
{
  const graph: Graph = new Graph();
  const node: Node = graph.addNode("foo", "bar");
  node.size = { w: 3, h: 4 };
  expect(node.size.w).toBe(3);
  expect(node.size.h).toBe(4);
});

it('undoes set position', () =>
{
  const graph: Graph = new Graph();
  const node: Node = graph.addNode("foo", "bar");
  node.position = { x: 1, y: 2 };
  node.position = { x: 3, y: 4 };
  graph.undo();
  expect(node.position.x).toBe(1);
  expect(node.position.y).toBe(2);
});

it('redoes set position', () =>
{
  const graph: Graph = new Graph();
  const node: Node = graph.addNode("foo", "bar");
  node.position = { x: 1, y: 2 };
  node.position = { x: 3, y: 4 };
  graph.undo();
  expect(node.position.x).toBe(1);
  expect(node.position.y).toBe(2);
  graph.redo();
  expect(node.position.x).toBe(3);
  expect(node.position.y).toBe(4);
});

it('overwrites forward history', () =>
{
  const graph: Graph = new Graph();
  const node: Node = graph.addNode("foo", "bar");
  node.position = { x: 1, y: 2 };
  node.position = { x: 3, y: 4 };
  graph.undo();
  node.position = { x: 5, y: 6 };
  expect(node.position.x).toBe(5);
  expect(node.position.y).toBe(6);
  graph.undo();
  expect(node.position.x).toBe(1);
  expect(node.position.y).toBe(2);
});

it('resets baseline', () =>
{
  const graph: Graph = new Graph();
  const node: Node = graph.addNode("foo", "bar");
  node.position = { x: 1, y: 2 };
  node.position = { x: 3, y: 4 };
  graph.resetBaseline();
  expect(node.position.x).toBe(3);
  expect(node.position.y).toBe(4);
  graph.undo();
  expect(node.position.x).toBe(3);
  expect(node.position.y).toBe(4);
});

it('adds and retrieves an edge', () =>
{
  const graph: Graph = new Graph();
  const foo: Node = graph.addNode("foo", "FOO");
  const bar: Node = graph.addNode("bar", "BAR");
  foo.addEdge("out1", bar, "in1");

  const edgesOut = foo.getForwardEdges();
  const edgeOut = edgesOut.get("out1");
  expect(edgeOut).toBeDefined();
  expect(edgeOut!.dest.id).toBe("bar");
  expect(edgeOut!.destInput).toBe("in1");

  const edgesIn = bar.getReverseEdges();
  const edgeIn = edgesIn.get("in1");
  expect(edgeIn).toBeDefined();
  expect(edgeIn!.src.id).toBe("foo");
  expect(edgeIn!.srcOutput).toBe("out1");
});

it('rolls back transactions', () =>
{
  const graph: Graph = new Graph();
  const node: Node = graph.addNode("foo", "bar");
  node.position = { x: 1, y: 2 };
  graph.beginTransaction();
  node.position = { x: 3, y: 4 };
  expect(node.position.x).toBe(3);
  expect(node.position.y).toBe(4);
  graph.rollbackTransaction();
  expect(node.position.x).toBe(1);
  expect(node.position.y).toBe(2);
});

it('commits transactions', () =>
{
  const graph: Graph = new Graph();
  const node: Node = graph.addNode("foo", "bar");
  node.position = { x: 1, y: 2 };
  graph.beginTransaction();
  node.position = { x: 3, y: 4 };
  expect(node.position.x).toBe(3);
  expect(node.position.y).toBe(4);
  graph.commitTransaction();
  expect(node.position.x).toBe(3);
  expect(node.position.y).toBe(4);
  graph.undo();
  expect(node.position.x).toBe(1);
  expect(node.position.y).toBe(2);
});
