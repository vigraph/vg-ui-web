import { Graph } from './Graph';
import { Node } from './Node';

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

it('sets node position', () =>
{
  const graph: Graph = new Graph();
  const node: Node = graph.addNode("foo", "bar");
  node.position = { x: 1, y: 2 };
  expect(node.position.x).toBe(1);
  expect(node.position.y).toBe(2);
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
