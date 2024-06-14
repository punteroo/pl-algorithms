/**
 * @typedef {Object} CanvasNode A visual representation of a node in the canvas.
 *
 * @property {number} id The node's unique identifier.
 * @property {number} x The node's x-coordinate.
 * @property {number} y The node's y-coordinate.
 * @property {number} radius The node's radius.
 */

/**
 * @typedef {Object} Edge A visual representation of an edge in the canvas.
 *
 * @property {CanvasNode} from The node where the edge starts.
 * @property {CanvasNode} to The node where the edge ends.
 * @property {number} value The edge's or connections' value/cost.
 */

/**
 * Interpret the form's input values and run the selected algorithm.
 *
 * @returns {void}
 */
function runAlgorithm() {
  // Get the form element
  const form = document.getElementById("algorithm-form");

  // Get the selected algorithm from the "algorithmSelect" select element.
  const algorithm = form.querySelector("#algorithmSelect").value;

  // Get the startNode numeric value.
  const startNode = form.querySelector("#startNode").value;

  // Find the node its referring, if it doesn't exist, return an error and throw an alert.
  const parsedStartNode = nodes?.find((node) => node?.id === Number(startNode));

  if (!parsedStartNode) {
    alert(
      "El nodo de inicio introducido no existe. Introduzca un numero de nodo valido."
    );
    return;
  }

  // Check the value of the checkbox
  const enableDirectedEdges = document.getElementById(
    "enableDirectedEdges"
  ).checked;

  console.log(enableDirectedEdges);

  // Run the selected algorithm
  try {
    let result = null;
    switch (algorithm) {
      case "prim":
        result = applyPrimsAlgorithm(edges, parsedStartNode);

        break;
      case "kruskal":
        result = applyKruskalsAlgorithm(edges);

        break;
      case "dijkstra":
        result = applyDijkstrasAlgorithm(
          edges,
          parsedStartNode,
          !enableDirectedEdges
        );

        break;
      default:
        throw new Error(
          "Se ha seleccionado un algoritmo no reconocido/implementado."
        );
    }

    if (!result) throw new Error("No se ha podido obtener un resultado.");

    // Alert the user that the algorithm has finished
    alert("El algoritmo ha finalizado con exito.");

    // Draw the result on the canvas
    drawEdges(result, enableDirectedEdges);

    // Log the result to the console
    console.log(result);
  } catch (e) {
    console.error(e);
    alert(`Ocurrio un error en la ejecucion del algoritmo: ${e}`);
  }
}

/**
 * Takes in a list of edges and draws them on the result canvas.
 *
 * All edges are colored green.
 * Nodes have a light-gray fill and they are inmutable.
 *
 * @param {Edge[]} edges The array of edges to draw.
 * @param {boolean} [directionalEdges=false] Whether the edges are directional or not.
 *
 * @returns {void}
 */
function drawEdges(edges, directionalEdges = false) {
  // Get the canvas element
  const canvas = document.getElementById("resultCanvas");

  // Get the canvas context
  const ctx = canvas.getContext("2d");

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the edges
  for (const edge of edges) {
    // Draw the edge with a big green stroke and its value as text hovering slightly above it.
    ctx.beginPath();
    ctx.moveTo(edge.from.x, edge.from.y);
    ctx.lineTo(edge.to.x, edge.to.y);
    ctx.strokeStyle = "green";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw the edge value
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "12px Arial";
    ctx.fillText(
      edge.value,
      (edge.from.x + edge.to.x) / 2,
      (edge.from.y + edge.to.y) / 2 - 10
    );

    // Draw arrow if directionalEdges is true
    if (directionalEdges) drawArrowResult(edge.from, edge.to, ctx);
  }

  // Draw the nodes
  for (const node of nodes) {
    // Draw the node with a light-gray fill and its ID as text inside it.
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
    ctx.fillStyle = "lightgray";
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "12px Arial";
    ctx.fillText(node.id, node.x, node.y);
  }
}

/**
 * Function to draw an arrow from one point to another.
 *
 * @param {Object} from - The starting point of the arrow.
 * @param {Object} to - The ending point of the arrow.
 * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on.
 */
function drawArrowResult(from, to, ctx) {
  const headLength = 15; // Length of the arrow head
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

  // Coordinates of the end of the line (before the arrowhead)
  const arrowX = to.x - headLength * Math.cos(angle);
  const arrowY = to.y - headLength * Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  // Draw arrowhead
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(
    arrowX - headLength * Math.cos(angle - Math.PI / 6),
    arrowY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(
    arrowX - headLength * Math.cos(angle + Math.PI / 6),
    arrowY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

/**
 * Applies Prim's algorithm to find the Minimum Spanning Tree (MST) of a graph.
 *
 * @param {Edge[]} edges - The array of existing edges in the graph.
 * @param {CanvasNode} startNode - The starting node for Prim's algorithm.
 *
 * @returns {Edge[]} - The array of edges that form the MST.
 */
function applyPrimsAlgorithm(edges, startNode) {
  /**
   * Initialize the MST edges array (output edges)
   *
   * @type {Edge[]}
   */
  const mstEdges = [];

  // A set to keep track of visited nodes
  const visitedNodes = new Set();

  // Add the start node to the visited nodes set
  visitedNodes.add(startNode.id);

  // A priority queue to select the edge with the smallest value
  const edgeQueue = [];

  // Helper function to add edges to the priority queue
  const addEdges = (node) => {
    for (const edge of edges) {
      if (edge.from.id === node.id && !visitedNodes.has(edge.to.id))
        edgeQueue.push(edge);
      else if (edge.to.id === node.id && !visitedNodes.has(edge.from.id))
        edgeQueue.push(edge);
    }

    // Sort the queue based on edge values (min-heap)
    edgeQueue.sort((a, b) => a.value - b.value);
  };

  // Add initial edges from the start node
  addEdges(startNode);

  // Loop until all nodes are visited or the edge queue is empty
  while (visitedNodes.size < edges.length + 1 && edgeQueue.length > 0) {
    // Get the edge with the smallest value
    const smallestEdge = edgeQueue.shift();

    // Determine the next node to visit
    const nextNode = !visitedNodes.has(smallestEdge.to.id)
      ? smallestEdge.to
      : smallestEdge.from;

    // If the next node is already visited, skip this edge
    if (visitedNodes.has(nextNode.id)) continue;

    // Add the edge to the MST
    mstEdges.push(smallestEdge);

    // Add the next node to the visited set
    visitedNodes.add(nextNode.id);

    // Add new edges from the newly visited node
    addEdges(nextNode);
  }

  return mstEdges;
}

/**
 * Applies Kruskal's algorithm to find the Minimum Spanning Tree (MST) of a graph.
 *
 * @param {Edge[]} edges The array of existing edges in the graph.
 *
 * @returns {Edge[]} The array of edges that form the MST.
 */
function applyKruskalsAlgorithm(edges) {
  // Initialize the MST edges array
  const mstEdges = [];

  // Helper function to find the root of a node
  const findRoot = (parent, node) => {
    while (parent[node] !== node) {
      parent[node] = parent[parent[node]]; // Path compression
      node = parent[node];
    }
    return node;
  };

  // Helper function to union two sets
  const union = (parent, rank, node1, node2) => {
    const root1 = findRoot(parent, node1),
      root2 = findRoot(parent, node2);

    if (root1 !== root2) {
      if (rank[root1] > rank[root2]) {
        parent[root2] = root1;
      } else if (rank[root1] < rank[root2]) {
        parent[root1] = root2;
      } else {
        parent[root2] = root1;
        rank[root1]++;
      }
    }
  };

  // Sort edges by their value (weight)
  edges.sort((a, b) => a.value - b.value);

  // Initialize parent and rank arrays for union-find
  const parent = {};
  const rank = {};

  // Initialize each node to be its own parent and rank to 0
  for (const edge of edges) {
    parent[edge.from.id] = edge.from.id;
    parent[edge.to.id] = edge.to.id;
    rank[edge.from.id] = 0;
    rank[edge.to.id] = 0;
  }

  // Iterate over the sorted edges
  for (const edge of edges) {
    const rootFrom = findRoot(parent, edge.from.id),
      rootTo = findRoot(parent, edge.to.id);

    // If the nodes are in different sets, add the edge to the MST
    if (rootFrom !== rootTo) {
      mstEdges.push(edge);
      union(parent, rank, edge.from.id, edge.to.id);
    }
  }

  return mstEdges;
}

/**
 * Applies Dijkstra's algorithm to find the shortest path from a start node to all other nodes in the graph.
 *
 * @param {Edge[]} edges The array of existing edges in the graph.
 * @param {CanvasNode} startNode The starting node for Dijkstra's algorithm.
 * @param {boolean} [simulateDirectionality=false] Whether to simulate bi-directionality of edges.
 *
 * @returns {Edge[]} The array of edges that form the shortest paths.
 */
function applyDijkstrasAlgorithm(
  edges,
  startNode,
  simulateDirectionality = false
) {
  const shortestPathEdges = [],
    distances = {},
    previousNodes = {},
    nodesQueue = [];

  // Initialize distances and previous nodes
  for (const edge of edges) {
    distances[edge.from.id] = Infinity;
    distances[edge.to.id] = Infinity;

    previousNodes[edge.from.id] = null;
    previousNodes[edge.to.id] = null;
  }

  distances[startNode.id] = 0;
  nodesQueue.push({ node: startNode, distance: 0 });

  // Create a map to store all edges for quick lookup
  const edgeMap = new Map();
  for (const edge of edges) {
    if (!edgeMap.has(edge.from.id)) edgeMap.set(edge.from.id, []);

    if (!edgeMap.has(edge.to.id)) edgeMap.set(edge.to.id, []);

    edgeMap.get(edge.from.id).push(edge);

    // If simulateDirectionality is true, add a reversed edge
    if (simulateDirectionality)
      edgeMap
        .get(edge.to.id)
        .push({ from: edge.to, to: edge.from, value: edge.value });
  }

  // If simulateDirectionality is false, ensure the graph is connected and throw an error if not
  if (!simulateDirectionality) {
    for (const edge of edges) {
      if (!edgeMap.get(edge.from.id) || !edgeMap.get(edge.to.id))
        throw new Error(
          "El grafo contiene ciclos/loops o se desconecta en algun momento."
        );
    }
  }

  while (nodesQueue.length > 0) {
    nodesQueue.sort((a, b) => a.distance - b.distance);
    const { node } = nodesQueue.shift();

    const neighbors = edgeMap.get(node.id) || [];
    for (const edge of neighbors) {
      const neighbor = edge.to;

      if (distances[neighbor.id] > distances[node.id] + edge.value) {
        distances[neighbor.id] = distances[node.id] + edge.value;
        previousNodes[neighbor.id] = node;
        nodesQueue.push({ node: neighbor, distance: distances[neighbor.id] });
      }
    }
  }

  for (const nodeId in previousNodes) {
    const prevNode = previousNodes[nodeId];
    if (prevNode) {
      const edge = edges.find(
        (edge) =>
          (edge.from.id === prevNode.id && edge.to.id === parseInt(nodeId)) ||
          (edge.to.id === prevNode.id && edge.from.id === parseInt(nodeId))
      );

      if (edge) shortestPathEdges.push(edge);
    }
  }

  return shortestPathEdges;
}
