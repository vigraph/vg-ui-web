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
  graph.addNode("foo", "bar");
  graph.setNodePosition("foo", { x: 1, y: 2 });
  const node: Node | null = graph.getNode("foo");
  expect(node).toBeDefined();
  expect(node!.position.x).toBe(1);
  expect(node!.position.y).toBe(2);
});
