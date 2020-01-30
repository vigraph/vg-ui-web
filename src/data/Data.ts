// ViGraph UI model - Graph Data class
// Copyright (c) Paul Clark 2019

// Class to interrogate and modify a dataflow graph within the ViGraph engine,
// as well as getting property Metadata, using REST protocol API.
// State is read/sent in JSON.  The URL format identifies a hierarchy of
// elements (nodes) by ID.
// Processes and combines graph, metadata, config data and layout data to create
// the graph model.

import * as rm from 'typed-rest-client/RestClient';

import * as vgTypes from '../lib/Types';
import { vgUtils } from '../lib/Utils';
import { vgConfig } from '../lib/Config';

class Data
{
  private rest: rm.RestClient;
  private restURL: string;
  private generateSuccess?: (json: any) => void;
  private metadata: vgTypes.IMetadata;
  private layoutData: vgTypes.ILayoutData;

  public constructor()
  {
    this.restURL = vgConfig.Graph.restURL;
    this.rest = new rm.RestClient('vigraph-rest', this.restURL);
    this.metadata = {};
    this.layoutData = {};
  }

  //============================================================================
  // Public access/update functions
  //============================================================================

  public returnMetadata()
  {
    return this.metadata;
  }

  // Get graph data JSON and layout data
  public getGraphToStore(success: (graphJSON: vgTypes.ICombinedGraph) => void)
  {
    this.getGraphData("graph", true, (rawGraph: vgTypes.IRawGraphItem) =>
      {
        // Prune layout to only paths that exist
        const finalLayout: vgTypes.ILayoutData = {};

        const parseGraphLevel = (graphItems:
          {[key: string]: vgTypes.IRawGraphItem}, prefix: string) =>
        {
          for (const key of Object.keys(graphItems))
          {
            const layoutID = prefix + "/" + key;
            if (this.layoutData[layoutID])
            {
              finalLayout[layoutID] = this.layoutData[layoutID];
            }

            const elements = graphItems[key].elements;
            if (elements !== undefined)
            {
              parseGraphLevel(elements, layoutID);
            }
          }
        }

        if (rawGraph.elements)
        {
          parseGraphLevel(rawGraph.elements, "graph");
        }

        this.layoutData = finalLayout;

        this.updateLayout(undefined, undefined, undefined, undefined, () =>
          {
            this.getCombinedGraphData(
              (combinedGraphJSON: vgTypes.ICombinedGraph) =>
              {
                success(combinedGraphJSON)
              });
          });
      });
  }

  // Load Graph from ICombinedGraph json (graph engine data and layout data)
  public loadGraphJSON(graphJSON: vgTypes.ICombinedGraph, success: () => void)
  {
    this.layoutData = graphJSON.layout;
    this.updateLayout();

    this.postFullGraph(graphJSON.graph, () =>
    {
      success();
    });
  }

  // Post full Graph data to engine
  public postFullGraph(graph: vgTypes.IRawGraphItem, success?: () => void,
    failure?: () => void)
  {
    const url = this.restURL + "/graph";

    fetch(url,
    {
      method: "POST",
      body: JSON.stringify(graph)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
          vgUtils.log("Post Full Graph Success");
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Post Full Graph Failure with response status: " +
            response.status)

          if (failure)
          {
            failure();
          }
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Post Full Graph Failure with error: " + error);

        if (failure)
        {
          failure();
        }
      });
  }

  // Update property (propID) on node (nodePath) with given value (value)
  public updateProperty(nodePath: string, propID: string,
    value: any, success?: () => void, failure?: () => void)
  {
    const url = this.restURL + "/" + nodePath + "/@" + propID;

    fetch(url,
    {
      method: "POST",
      body: JSON.stringify({value})
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
          // vgUtils.log("Update Property Success");
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Update Property Failure with response status: " +
            response.status)

          if (failure)
          {
            failure();
          }
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Update Property Failure with error: " + error);

        if (failure)
        {
          failure();
        }
      });
  }

  // Get and return property value
  public getPropertyValue(nodePath: string, propID: string,
    success?: (value: any) => void, failure?: () => void)
  {
    this.getProperty(nodePath + "/@" + propID + "?transient=1",
      (property: vgTypes.IRawProperty) =>
      {
        if (success)
        {
          success(property.value);
        }
      });
  }

  private async getProperty(path: string,
    success?: (result: vgTypes.IRawProperty)=>void, failure?: () => void)
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.IRawProperty> =
        await this.rest.get<vgTypes.IRawProperty>('/' + path);

      if (res.statusCode === 200 && res.result && success)
      {
        vgUtils.log("Get Raw Property Success");
        success(res.result);
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Raw Property Failure with status code: " +
          res.statusCode);

        if (failure)
        {
          failure();
        }
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Raw Property Failure with error: " + error);

      if (failure)
      {
        failure();
      }
    }
  }

  // Update layout data. If no name, position or size given then layout data for
  // given id is removed. If no id given then this.layoutData is sent with
  // no updates.
  // Note: ID is node path
  public updateLayout(id?: string, position?: {x: number, y: number},
    size?: {w: number, h: number}, name?: {n: string}, success?: () => void)
  {
    const url = this.restURL + "/layout";

    if (id)
    {
      if (!position && !size && !name)
      {
        delete this.layoutData[id];

        // Delete all subgraph children if found
        for (const key of Object.keys(this.layoutData))
        {
          const start = key.slice(0, id.length);
          if (id === start)
          {
            delete this.layoutData[key];
          }
        }
      }
      else
      {
        this.layoutData[id] = {...this.layoutData[id], ...position, ...size,
          ...name};
      }
    }

    fetch(url,
    {
      method: "POST",
      body: JSON.stringify(this.layoutData)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
          vgUtils.log("Update Layout Success");

          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Update Layout Failure with response status: " +
            response.status);
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Update Layout Failure with error: " + error);
      });
  }

  // Get layout data for given ID
  public getLayoutByID(id: string)
  {
    return this.layoutData[id];
  }

  // Update edges from output Node with an Array of all valid edges.
  // Edge removed by copying current edges, removing the edge and updating with
  // new array.
  public updateEdges(outputNodePath: string, outputID: string,
    edges: Array<{dest: string, destInput: string}>, success?: ()=>void,
    failure?: () => void)
  {
    const url = this.restURL + "/" + outputNodePath + "/@" + outputID;

    const data: Array<{"element": string, "input": string}> = [];

    edges.forEach((value: {dest: string, destInput: string}) =>
    {
      data.push({"element": value.dest, "input": value.destInput});
    })

    fetch(url,
    {
      method: "POST",
      body: JSON.stringify({connections: data})
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          vgUtils.log("Update Edges Success");

          // Success
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Update Edges Success with response status: " +
            response.status);

          if (failure)
          {
            failure();
          }
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Update Edges Success with error: " + error);

        if (failure)
        {
          failure();
        }
      });
  }

  // Get node and calls success with resulting (processed) node allowing it to
  // be added to the Graph model
  public getNode(nodeID: string, parentPath: string,
    success?: (result: any) => void, failure?: () => void)
  {
    vgUtils.log("Get Node: " + nodeID);

    const path = parentPath + '/' + nodeID;

    this.getRawGraphItem(path, (result) =>
    {
      vgUtils.log("Process raw node");
      if (this.metadata)
      {
        const item = this.processSingleGraphItem(nodeID, result, parentPath);

        const propConfig = vgConfig.Properties[item.type];

        // Node properties layout (height, width, x, y)
        const w = this.layoutData[item.path] && this.layoutData[item.path].w ?
          this.layoutData[item.path].w : (propConfig ? propConfig.width : 0);

        const h = this.calculateNodeHeight(item);

        const x = this.layoutData[item.path] && this.layoutData[item.path].x ?
          this.layoutData[item.path].x : 0;
        const y = this.layoutData[item.path] && this.layoutData[item.path].y ?
          this.layoutData[item.path].y : 0;

        const displayName = this.layoutData[item.path] &&
          this.layoutData[item.path].n ? this.layoutData[item.path].n :
          undefined;

        const layout = {h, w, x, y, displayName};

        if (success) success({...item, ...layout});
      }
      else
      {
        // Error - trying to create node before Graph set up
        vgUtils.log("Process Get Node Failure: Trying to process node " +
          "before full Graph set up");

        if (failure)
        {
          failure();
        }
      }
    },
    () =>
    {
      if (failure)
      {
        failure();
      }
    })
  }

  private async getRawGraphItem(path: string,
    success?: (result: vgTypes.IRawGraphItem)=>void, failure?: () => void)
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.IRawGraphItem> =
        await this.rest.get<vgTypes.IRawGraphItem>('/' + path);

      if (res.statusCode === 200 && res.result && success)
      {
        vgUtils.log("Get Raw Graph Item By Path Success");
        success(res.result);
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Raw Graph Item Failure with status code: " +
          res.statusCode);

        if (failure)
        {
          failure();
        }
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Raw Graph Item Failure with error: " + error);

      if (failure)
      {
        failure();
      }
    }
  }

  // Create/add node with ID nodeID and type nodeType to Graph
  // Calls success function on PUT success
  public createNode(nodeID: string, nodeType: string, parentPath: string,
    success?: ()=>void, failure?: () => void)
  {
    const url = this.restURL + "/" + parentPath + "/" + nodeID;

    const data = {type: nodeType}

    fetch(url,
    {
      method: "PUT",
      body: JSON.stringify(data)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          vgUtils.log("Create Node Success");

          // Success
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Create Node Failure with response status: " +
            response.status);

          if (failure)
          {
            failure();
          }
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Create Node Failure with error: " + error);

        if (failure)
        {
          failure();
        }
      });
  }

  // Delete node from Graph
  // Calls success on DELETE success
  public deleteNode(nodePath: string, success?: ()=>void, failure?: () => void)
  {
    const url = this.restURL + "/" + nodePath;

    fetch(url,
    {
      method: "DELETE"
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          vgUtils.log("Delete Node Success");

          this.updateLayout(nodePath);

          // Success
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Delete Node Failure with response status: " +
            response.status);

          if (failure)
          {
            failure();
          }
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Delete Node Failure with error: " + error);

        if (failure)
        {
          failure();
        }
      });
  }

  // Post non-property data
  public nonPropertyPost(id: string, data: any, path: string,
    success?: () => void, failure?: () => void)
  {
    const url = this.restURL + "/" + path + "/@" + id;

    fetch(url,
    {
      method: "POST",
      body: JSON.stringify(data)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
          vgUtils.log("Non Property Post Success");
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Non Property Post Failure with response status: " +
            response.status)

          if (failure)
          {
            failure();
          }
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Non Property Post Failure with error: " + error);

        if (failure)
        {
          failure();
        }
      });
  }

  // Delete non-property id
  public nonPropertyDelete(id: string, path: string, success?: () => void,
    failure?: () => void)
  {
    const url = this.restURL + "/" + path + "/@" + id;

    fetch(url,
    {
      method: "DELETE"
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
          vgUtils.log("Non Property Delete Success");
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Non Property Delete Failure with response status: " +
            response.status)

          if (failure)
          {
            failure();
          }
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Non Property Delete Failure with error: " + error);

        if (failure)
        {
          failure();
        }
      });
  }

  //============================================================================
  // Generate Graph from Graph data, Metadata and Layout data
  //============================================================================

  // Generate Graph by getting metadata, layout data and graph data and then
  // processing and combining
  public generateGraph(path: string, success: (json: any) => void)
  {
    this.generateSuccess = success;

    const getLayout = () =>
    {
      if (Object.keys(this.layoutData).length > 0)
      {
        this.getGraphData(path);
      }
      else
      {
        this.getLayoutData(() => { this.getGraphData(path); });
      }
    }

    if (Object.keys(this.metadata).length > 0)
    {
      getLayout();
    }
    else
    {
      this.getMetadata(() => {getLayout()});
    }
  }

  //============================================================================
  // Metadata
  //============================================================================

  // Get properties metadata
  private async getMetadata(success: () => void)
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.IMetadata> =
        await this.rest.get<vgTypes.IMetadata>('/meta');

      if (res.statusCode === 200 && res.result)
      {
        vgUtils.log("Get Metadata Success");
        this.metadata = res.result

        success();
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Metadata Failure with status code: " +
          res.statusCode);
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Metadata Failure with error: " + error);
    }
  }

  //============================================================================
  // Layout Data
  //============================================================================

  // Get data for graph layout
  private async getLayoutData(finished: () => void)
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.ILayoutData> =
        await this.rest.get<vgTypes.ILayoutData>('/layout');

      if (res.statusCode === 200 && res.result)
      {
        vgUtils.log("Get Layout Data Success");
        this.layoutData = res.result;
        finished();
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Layout Data Failure with status code: " +
          res.statusCode);
        finished();
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Layout Data Failure with error: " + error);
      finished();
    }
  }

  // Layout Graph and pass full graph on to final success callback
  public layoutGraph(nodes: vgTypes.IProcessedGraphItem[],
    success: (json: any) => void)
  {
    // Process layout using stored layout data. If layout data not found
    // for given nodes then layout automatically generated
    this.processLayout(nodes, success,
      (lNodes: vgTypes.IProcessedGraphItem[]) =>
      {
        this.generateLayout(lNodes, success);
      });
  }

  // Process layout data and combine with node data
  private processLayout(nodes: vgTypes.IProcessedGraphItem[],
    success: (json: any) => void,
    failure: (nodes: vgTypes.IProcessedGraphItem[]) => void)
  {
    const layout = this.layoutData;
    const layoutNodes: any[] = [];

    const currentLayouts: vgTypes.ILayoutData = {};
    let nodePathLevel: string = "";

    nodes.forEach((node: vgTypes.IProcessedGraphItem) =>
    {
      const propConfig = vgConfig.Properties[node.type];

      // Node found in layout so add to current valid layouts store
      if (layout[node.path])
      {
        currentLayouts[node.path] = layout[node.path];
      }

      if (!nodePathLevel)
      {
        nodePathLevel = node.path
      }

      const height = this.calculateNodeHeight(node);
      const width = layout[node.path] && layout[node.path].w ?
        layout[node.path].w : (propConfig ? propConfig.width : 50);

      const name = layout[node.path] && layout[node.path].n ?
        layout[node.path].n : undefined;

      const nodeLayout =
      {
        x: layout[node.path] ? layout[node.path].x : 0,
        y: layout[node.path] ? layout[node.path].y : 0,
        h: height,
        w: width,
        displayName: name
      }

      layoutNodes.push({...node, ...nodeLayout});
    });

    if (Object.keys(currentLayouts).length > 0)
    {
      const graph = { "nodes" : layoutNodes };
      success(graph);
    }
    else
    {
      failure(nodes);
    }
  }

  // Calculate node height based on layout data, properties config and number
  // of inputs/outputs (if dynamic)
  private calculateNodeHeight(node: vgTypes.IProcessedGraphItem)
  {
    const propConfig = vgConfig.Properties[node.type];

    const layoutH = (this.layoutData[node.path] ? this.layoutData[node.path].h :
      undefined);

    let h: number = (layoutH !== undefined ? layoutH :
      (propConfig ? propConfig.height : 50));

    if (node.dynamic)
    {
      const connectorPadding = vgConfig.Graph.connector.padding;
      const minHeight = Math.max((node.inputs.length + 1) * connectorPadding,
        (node.outputs.length + 1) * connectorPadding);

      h = (h ? Math.max(minHeight, h) : minHeight);
    }

    return h;
  }

  // Generate Graph layout without node position data. Nodes ranked by number of
  // parents and laid out without overlapping. Nodes with no edges have rank 0.
  private generateLayout(nodes: vgTypes.IProcessedGraphItem[],
    success: (json: any) => void)
  {
    // Store input and output IDs used to layout Graph without
    // node position data
    const inputEdgeMap: { [key: string]: string[] } = {};
    const outputEdgeMap: { [key: string]: string[] } = {};

    nodes.forEach((node: vgTypes.IProcessedGraphItem, index: number) =>
    {
      node.edges.forEach((edge: {output: string, destId: string, input: string},
        eIndex: number) =>
      {
        inputEdgeMap[edge.destId] ? inputEdgeMap[edge.destId].push(node.id) :
          inputEdgeMap[edge.destId] = [node.id];

        outputEdgeMap[node.id] ? outputEdgeMap[node.id].push(edge.destId) :
          outputEdgeMap[node.id] = [edge.destId];
      })
    })

    // Rank nodes based on 'level' in the graph. No edges = 0, output and no
    // input = 1 and so on.
    const ranks: { [key: string] : number } = {};

    const rankNodes = (rank: number, rNodes: string[]) =>
    {
      rNodes.forEach((name: string) =>
      {
        if (!ranks[name])
        {
          ranks[name] = rank;
          if (outputEdgeMap[name])
          {
            rankNodes(rank+1, outputEdgeMap[name]);
          }
        }
      });
    }

    for (const key of Object.keys(outputEdgeMap))
    {
      if (!inputEdgeMap[key])
      {
        ranks[key] = 1;
        rankNodes(2, outputEdgeMap[key]);
      }
    }

    // Add nodes that don't have a rank (no edges)
    nodes.forEach((node: vgTypes.IProcessedGraphItem) =>
    {
      if (!ranks[node.id])
      {
        ranks[node.id] = 0
      }
    });

    // Reorder nodes based on rank
    const nodesByRank2D: string[][] = [];

    for (const nodeID of Object.keys(ranks))
    {
      const rank = ranks[nodeID];
      if (!nodesByRank2D[rank])
      {
        nodesByRank2D[rank] = [];
      }

      nodesByRank2D[rank].push(nodeID);
    }

    const nodesByRank: vgTypes.IProcessedGraphItem[] = [];

    nodesByRank2D.flat().forEach((nodeID: string) =>
      {
        const node = nodes.find(x => x.id === nodeID);
        if (node)
        {
          nodesByRank.push(node);
        }
      });

    // Calculate layout
    const rankNextPos: [{x: number, y: number}] = [{x: 0, y: 0}];

    const layoutNodes: any[] = [];

    nodesByRank.forEach((value: vgTypes.IProcessedGraphItem) =>
    {
      const layout = {x: 0, y: 0, h: 50, w: 50};

      if (vgConfig.Properties[value.type])
      {
        layout.w = vgConfig.Properties[value.type].width;
      }

      layout.h = this.calculateNodeHeight(value);

      const nRank = ranks[value.id] ? ranks[value.id] : 0;

      // Position nodes in this rank based on the previous nodes height and
      // the nodes in the next rank based on the largest (width) node so far
      if (!rankNextPos[nRank])
      {
        rankNextPos[nRank] = {x: 0, y: 0};
      }

      layout.x = (rankNextPos[nRank].x) + vgConfig.Graph.layoutPadding.x;
      layout.y = (rankNextPos[nRank].y) + vgConfig.Graph.layoutPadding.y;

      rankNextPos[nRank] = {x: rankNextPos[nRank].x,
        y: layout.y + layout.h};

      if (!rankNextPos[nRank+1])
      {
        rankNextPos[nRank+1] = {x: 0, y: 0};
      }

      rankNextPos[nRank+1] = {x: Math.max(layout.x + layout.w,
        rankNextPos[nRank+1].x),
        y: rankNextPos[nRank+1].y};

      layoutNodes.push({...value, ...layout});
      this.layoutData[value.path] = {x: layout.x, y: layout.y};
    })

    this.updateLayout();

    const graph = { "nodes" : layoutNodes };
    success(graph);
  }

  //============================================================================
  // Graph Data
  //============================================================================

  // Get data for entire graph and create graph model or return raw data
  private async getGraphData(path: string, recursive?: boolean,
    returnRaw?: (rawData: vgTypes.IRawGraphItem) => void)
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.IRawGraphItem> =
        await this.rest.get<vgTypes.IRawGraphItem>("/" + path +
          (recursive?"?recursive=1":""));

      if (res.statusCode === 200 && res.result)
      {
        vgUtils.log("Get Graph Data Success");
        if (returnRaw)
        {
          returnRaw(res.result);
        }
        else
        {
          this.createGraphModel(res.result, path);
        }
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Graph Data Failure with status code: " +
          res.statusCode);
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Graph Data Failure with error: " + error);
    }
  }

  // Get data for entire graph combined with layout data
  private async getCombinedGraphData(success:
    (combinedData: vgTypes.ICombinedGraph) => void)
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.ICombinedGraph> =
        await this.rest.get<vgTypes.ICombinedGraph>("/combined");

      if (res.statusCode === 200 && res.result)
      {
        vgUtils.log("Get Combined Graph Data Success");
        success(res.result);
      }
      else
      {
        // Error with status code
        vgUtils.log("Get combined Graph Data Failure with status code: " +
          res.statusCode);
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Combined Graph Data Failure with error: " + error);
    }
  }

  // Create Graph model from processed raw graph data
  private createGraphModel(rawGraphData: vgTypes.IRawGraphItem,
    parentPath: string)
  {
    const nodes: vgTypes.IProcessedGraphItem[] = [];

    if (rawGraphData.elements)
    {
      for (const itemID of Object.keys(rawGraphData.elements))
      {
        nodes.push(this.processSingleGraphItem(itemID,
          rawGraphData["elements"][itemID], parentPath));
      }
    }

    this.layoutGraph(nodes, (graph: any) =>
      {
        this.generateSuccess!(graph);
      });
  }

  // Process a single graph item into format to create Graph model
  // (see type definitions)
  // parentPath is the path to the node (graph item) parent e.g. graph/graph-1
  // in the case of subgraphs
  private processSingleGraphItem(itemID: string, item: vgTypes.IRawGraphItem,
    parentPath: string)
  {
    const splitType = item.type.split("/");
    const itemSection = splitType[0];
    const itemType = splitType[1];
    const metadata = this.metadata[itemSection][itemType];
    const propsConfig = vgConfig.Properties[item.type];

    // Edges
    const gEdges:
      Array<{ output: string, destId: string, input: string}> = [];

    if (item.outputs)
    {
      for (const outputID of Object.keys(item.outputs))
      {
        const connections = item.outputs[outputID].connections;
        if (connections)
        {
          connections.forEach(
            (connection: {element: string, input: string}) =>
            {
              gEdges.push({ output: outputID, destId: connection.element,
                input: connection.input})
            });
        }
      }
    }

    // Get connector position from properties config for a given input/output id
    const getConnectorPosition = (id: string) =>
    {
      if (propsConfig && propsConfig.properties[id])
      {
        return propsConfig.properties[id].connector;
      }
    }

    // Inputs - position added later
    const gInputs:
      Array<{ id: string, type: string, sampleRate: number, x?: number,
        y?: number}> = [];

    const mInputs = metadata.inputs;
    if (mInputs)
    {
      for (const inputID of Object.keys(mInputs))
      {
        const sampleRate = (item.inputs && item.inputs[inputID].sample_rate) ?
          item.inputs[inputID].sample_rate:0

        gInputs.push({id: inputID, type: mInputs[inputID].type, sampleRate:
          sampleRate ? sampleRate : 0, ...getConnectorPosition(inputID)});
      }
    }

    // Outputs
    const gOutputs: Array<{ id: string, type: string, sampleRate: number }> = [];

    const mOutputs = metadata.outputs;
    if (mOutputs)
    {
      for (const outputID of Object.keys(mOutputs))
      {
        gOutputs.push({id: outputID, type: mOutputs[outputID].type,
          sampleRate: item.outputs?item.outputs[outputID].sample_rate:0,
          ...getConnectorPosition(outputID)});
      }
    }

    // Dynamic element so add inputs/outputs from graph data
    if (item.dynamic)
    {
      if (item.inputs)
      {
        for (const iID of Object.keys(item.inputs))
        {
          gInputs.push({id: iID, type: item.inputs[iID].type,
            sampleRate: item.inputs[iID].sample_rate || 0,
            ...getConnectorPosition(iID)});
        }
      }

      if (item.outputs)
      {
        for (const oID of Object.keys(item.outputs))
        {
          gOutputs.push({id: oID, type: item.outputs[oID].type,
            sampleRate: item.outputs[oID].sample_rate,
            ...getConnectorPosition(oID)});
        }
      }
    }

    // Properties: inputs and settings
    const gProps: Array<{ id: string, value: any, valueType: string,
      propType: string, description?: string, controlType?: string,
      valueFormat?: string, rangeMin?: number, rangeMax?: number,
      increment?: number, x?: number, y?: number}> = [];

    const itemStrings = vgConfig.Strings.descriptions[item.type];

    if (metadata.inputs)
    {
      for (const inputID of Object.keys(metadata.inputs))
      {
        const iPropsConfig = (propsConfig && propsConfig.properties[inputID] ?
          propsConfig.properties[inputID] : null);

        const iPropsStrings = (itemStrings && itemStrings.properties &&
          itemStrings.properties[inputID] ? itemStrings.properties[inputID] :
          null);

        const itemInput = item.inputs ? item.inputs[inputID] : null;

        gProps.push(
        {
          id: inputID,
          value: (itemInput ? itemInput.value : undefined),
          valueType: (itemInput ? itemInput.type : "number"),
          propType: "input",
          ...iPropsConfig, ...iPropsStrings
        });
      }
    }

    if (metadata.settings)
    {
      for (const settingID of Object.keys(metadata.settings))
      {
        const sPropsConfig = (propsConfig && propsConfig.properties[settingID] ?
          propsConfig.properties[settingID] : {});

        const sPropsStrings = (itemStrings && itemStrings.properties &&
          itemStrings.properties[settingID] ?
          itemStrings.properties[settingID] : null);

        const itemSetting = item.settings ? item.settings[settingID] : null;

        gProps.push(
        {
          id: settingID,
          value: (itemSetting ? itemSetting.value : undefined),
          valueType: (itemSetting ? itemSetting.type : "number"),
          propType: "setting",
          ...sPropsConfig, ...sPropsStrings
        });
      }
    }

    // Subgraph (graph, clone)
    const gSubGraph = (itemType === "graph" || itemType === "clone");

    const node: vgTypes.IProcessedGraphItem =
    {
      id: itemID,
      name: metadata.name,
      type: item.type,
      path: parentPath + "/" + itemID,
      dynamic: metadata.dynamic,
      category: propsConfig ? propsConfig.category : undefined,
      description: itemStrings ? itemStrings.description : "",
      inputs: gInputs,
      outputs: gOutputs,
      edges: gEdges,
      properties: gProps,
      subGraph: gSubGraph
    };

    return node;
  }
}

export const vgData = new Data();
