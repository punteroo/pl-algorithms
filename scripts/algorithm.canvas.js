/**
 * Disclaimer 2024-05-29
 *
 * Most of this code was AI genereated and optimized manually by me.
 * The code is not perfect and may contain bugs.
 *
 * This is a simple graphical implementation for a graph data structure drawing.
 * Please do not use this code in production without proper testing, as it is only a prototype for academic purposes.
 * Use at will as long as credit is due.
 *
 * With love,
 * Lucas 'punteroo' Maza
 */

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
 * @property {Node} from The node where the edge starts.
 * @property {Node} to The node where the edge ends.
 * @property {number} value The edge's or connections' value/cost.
 */

/** Global variable that obtains the Canvas DOM element. */
const canvas = document.getElementById("canvas");

/** Global variable to access the canvas' context and manipulate it. */
const ctx = canvas.getContext("2d");

/**
 * Main variable where the drawing's nodes are stored.
 *
 * @type {Array<CanvasNode>}
 */
const nodes = [],
  /**
   * Main variable where the node's connections are stored.
   *
   * @type {Array<Edge>}
   */
  edges = [];

/**
 * Global variable to store the selected node (when creating a new connection)
 *
 * @type {CanvasNode}
 */
let selectedNode = null;

/**
 * Global variable to store the offset between the mouse and the selected node.
 * Used to move the node around the canvas, on the X axis.
 *
 * @type {number}
 */
let offsetX,
  /**
   * Global variable to store the offset between the mouse and the selected node.
   * Used to move the node around the canvas, on the Y axis.
   *
   * @type {number}
   */ offsetY;

/**
 * Global variable to store the first node selected when creating a new connection.
 *
 * @type {CanvasNode}
 */
let firstNode = null;

/**
 * Temporary line drawn in the canvas when creating a new connection.
 *
 * @type {Edge}
 */
let tempLine = null;

/**
 * Global counter for the nodes' unique identifiers.
 * Increments every time a new node is created, and is reset when the canvas is cleared.
 *
 * @type {number}
 */
let nodeIdCounter = 1;

/** Assigns an event listener to reset the canvas. */
document.getElementById("resetButton").addEventListener("click", resetCanvas);

/** Assigns an event listener to export the current canvas into a text file. */
document.getElementById("exportButton").addEventListener("click", exportData);

/** Assigns an event listener to import a text file into the canvas. */
document.getElementById("importButton").addEventListener("click", () => {
  // If its already reset, just go ahead and import the file.
  if (nodes.length === 0) {
    document.getElementById("importFile").click();
    return;
  }

  if (
    confirm("Esto reemplazará los nodos y conexiones actuales. ¿Estás seguro?")
  )
    document.getElementById("importFile").click();
});

/** Assigns an event listener to the file input to import the data. */
document.getElementById("importFile").addEventListener("change", importData);

/** Assigns an event listener to the checkbox to redraw the canvas when its value changes. */
document
  .getElementById("enableDirectedEdges")
  .addEventListener("change", () => {
    if (!document.getElementById("enableDirectedEdges").checked) {
      for (let i = edges.length - 1; i >= 0; i--) {
        const edge = edges[i];
        const duplicates = edges.filter(
          (e) =>
            (e.from === edge.from && e.to === edge.to) ||
            (e.from === edge.to && e.to === edge.from)
        );

        if (duplicates.length > 1) {
          edges.splice(i, 1);
        }
      }
    }
    draw();
  });

/**
 * Assigns event listeners to the canvas to handle the mouse events.
 *
 * Specifically this is to create, move, and delete nodes and connections.
 */
canvas.addEventListener("mousedown", (e) => {
  const { offsetX: x, offsetY: y } = e;

  // Right-click: Delete a node as long as the mouse is over it
  if (e.button === 2) {
    // Find the node to delete via its coordinates + radius.
    const nodeIndex = nodes.findIndex(
      (node) => Math.hypot(node.x - x, node.y - y) < node.radius
    );

    // If found, remove the node from the nodes array.
    if (nodeIndex !== -1) {
      // Access the node's object inside the array.
      const nodeToRemove = nodes[nodeIndex];

      // Remove the node from the array.
      nodes.splice(nodeIndex, 1);

      // Also remove any connections to the removed node
      for (let i = edges.length - 1; i >= 0; i--) {
        if (edges[i].from === nodeToRemove || edges[i].to === nodeToRemove) {
          edges.splice(i, 1);
        }
      }

      draw();
    }
  } else {
    // Left-click
    if (firstNode) {
      const clickedNode = nodes.find(
        (node) => Math.hypot(node.x - x, node.y - y) < node.radius
      );

      if (clickedNode) {
        if (firstNode !== clickedNode && !edgeExists(firstNode, clickedNode)) {
          let value;

          do {
            value = prompt(
              "Introduzca el valor deseado de la arista (numero no negativo):"
            );

            if (value === null) {
              firstNode = null;
              tempLine = null;
              draw();
              return;
            }
          } while (isNaN(value) || Number(value) < 0);

          const enableDirectedEdges = document.getElementById(
            "enableDirectedEdges"
          ).checked;
          const isDuplicateEdge = edges.some(
            (edge) =>
              (edge.from === firstNode && edge.to === clickedNode) ||
              (edge.from === clickedNode && edge.to === firstNode)
          );

          edges.push({
            from: firstNode,
            to: clickedNode,
            value: Number(value),
            offset: enableDirectedEdges && isDuplicateEdge ? 10 : 0,
          });

          draw();
        }

        firstNode = null;
        tempLine = null;
      } else {
        firstNode = null;
        tempLine = null;
        draw();
      }
    } else {
      selectedNode = nodes.find(
        (node) => Math.hypot(node.x - x, node.y - y) < node.radius
      );

      if (selectedNode) {
        offsetX = x - selectedNode.x;

        offsetY = y - selectedNode.y;
      } else {
        const clickedEdge = edges.find((edge) =>
          isPointOnLineSegment(edge, x, y)
        );

        if (!clickedEdge) {
          nodes.push({ id: nodeIdCounter++, x, y, radius: 20 });

          draw();
        }
      }
    }
  }

  checkForm();
});

canvas.addEventListener("mousemove", (e) => {
  const { offsetX: x, offsetY: y } = e;

  if (selectedNode) {
    selectedNode.x = x - offsetX;

    selectedNode.y = y - offsetY;

    draw();
  }

  if (firstNode) {
    tempLine = { from: firstNode, to: { x, y } };

    draw();
  }
});

canvas.addEventListener("mouseup", () => {
  selectedNode = null;
});

canvas.addEventListener("dblclick", (e) => {
  const { offsetX: x, offsetY: y } = e;

  const clickedNode = nodes.find(
    (node) => Math.hypot(node.x - x, node.y - y) < node.radius
  );

  if (clickedNode) {
    firstNode = clickedNode;
  } else {
    const clickedEdge = edges.find((edge) => isPointOnLineSegment(edge, x, y));

    if (clickedEdge) {
      let value;

      do {
        value = prompt(
          "Introduzca el nuevo valor para esta arista (no negativo):",
          clickedEdge.value
        );

        if (value === null) return;
      } while (isNaN(value) || Number(value) < 0);

      clickedEdge.value = Number(value);

      draw();
    }
  }

  checkForm();
});

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

/**
 * Checks if an edge/connection already exists between two nodes.
 *
 * @param {Node} node1
 * @param {Node} node2
 *
 * @returns {boolean} True if the edge exists, false otherwise.
 */
function edgeExists(node1, node2) {
  const enableDirectedEdges = document.getElementById(
    "enableDirectedEdges"
  ).checked;
  const existingEdges = edges.filter(
    (edge) =>
      (edge.from === node1 && edge.to === node2) ||
      (edge.from === node2 && edge.to === node1)
  );

  if (enableDirectedEdges) {
    // Allow up to 2 edges, but not in the same direction
    const sameDirectionEdge = edges.find(
      (edge) => edge.from === node1 && edge.to === node2
    );
    return sameDirectionEdge ? true : existingEdges.length >= 2;
  }

  return existingEdges.length >= 1;
}

/**
 * Checks if a point is on a line segment.
 *
 * @param {Edge} edge The edge to check.
 * @param {number} x The x-coordinate of the point.
 * @param {number} y The y-coordinate of the point.
 *
 * @returns {boolean} True if the point is on the line segment, false otherwise.
 */
function isPointOnLineSegment(edge, x, y) {
  // Obtain the coordinates of the edge's nodes.
  const { from, to } = edge;

  // Calculate the distance between the point and the line
  const distance =
    Math.abs(
      (to.y - from.y) * x - (to.x - from.x) * y + to.x * from.y - to.y * from.x
    ) / Math.hypot(to.y - from.y, to.x - from.x);

  return (
    distance < 10 && // Increase the clickable zone around the line
    x >= Math.min(from.x, to.x) &&
    x <= Math.max(from.x, to.x) &&
    y >= Math.min(from.y, to.y) &&
    y <= Math.max(from.y, to.y)
  );
}

/**
 * Function to draw an arrow from one point to another.
 *
 * @param {Object} from - The starting point of the arrow.
 * @param {Object} to - The ending point of the arrow.
 */
function drawArrow(from, to) {
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
 * Main function used to instance a new re-draw of the entire canvas.
 *
 * This is used when an update is done on the nodes or its connections.
 *
 * @returns {void}
 */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Check the value of the checkbox
  const enableDirectedEdges = document.getElementById(
    "enableDirectedEdges"
  ).checked;

  // Draw edges
  ctx.lineWidth = 5; // Increase the line width

  edges.forEach((edge) => {
    ctx.beginPath();

    // Apply the offset if it exists
    const offsetX = edge.offset ? Math.cos(Math.PI / 4) * edge.offset : 0;
    const offsetY = edge.offset ? Math.sin(Math.PI / 4) * edge.offset : 0;

    ctx.moveTo(edge.from.x + offsetX, edge.from.y + offsetY);
    ctx.lineTo(edge.to.x + offsetX, edge.to.y + offsetY);
    ctx.stroke();

    // Draw edge value
    const midX = (edge.from.x + edge.to.x) / 2 + offsetX;
    const midY = (edge.from.y + edge.to.y) / 2 + offsetY;

    const offset = 10; // Offset to separate the number from the line.

    // Calculate the angle of the line
    const angle = Math.atan2(edge.to.y - edge.from.y, edge.to.x - edge.from.x);

    // Calculate the position of the text based on the angle for the connection.
    const textX = midX + offset * Math.cos(angle - Math.PI / 2);
    const textY = midY + offset * Math.sin(angle - Math.PI / 2);

    // Draw the text.
    ctx.fillStyle = "black";
    ctx.fillText(edge.value, textX, textY);

    // Draw arrow if directed edges are enabled
    if (enableDirectedEdges) drawArrow(edge.from, edge.to);
  });

  // If a temporary line is being drawn, draw it on the canvas (when creating a new connection).
  if (tempLine) {
    ctx.beginPath();
    ctx.moveTo(tempLine.from.x, tempLine.from.y);
    ctx.lineTo(tempLine.to.x, tempLine.to.y);

    ctx.strokeStyle = "gray";
    ctx.stroke();
  }

  ctx.lineWidth = 1; // Reset the line width for nodes
  /** Draw each node on the array. */
  nodes.forEach((node) => {
    ctx.beginPath();

    // Draw the node's circle using the node's coordinates and set radius.
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

    ctx.fillStyle = "white";

    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.fillText(node.id, node.x - 5, node.y + 5);
  });

  // Draw the total number of nodes and connections on the canvas.
  ctx.fillStyle = "black";

  ctx.font = "14px Arial";

  ctx.fillText(`Cantidad de Nodos: ${nodes.length}`, 10, 20);

  // Map connections to a string.
  const connections = edges.map(
    (edge) =>
      `(${edge.from.id} ${enableDirectedEdges ? "->" : "<->"} ${edge.to.id}: ${
        edge.value
      })`
  );

  // Add a new line for every 15 connections to avoid overflow.
  ctx.fillText(`Aristas`, 10, 40);
  for (let i = 0; i < connections.length; i += 10)
    ctx.fillText(connections.slice(i, i + 10).join(", "), 10, 60 + i * 2);
}

/**
 * Resets the canvas by removing all nodes and connections.
 *
 * @returns {void}
 */
function resetCanvas() {
  // Set the arrays' lengths to 0 to remove all elements.
  nodes.length = 0;
  edges.length = 0;

  // Reset the node counter to 1.
  nodeIdCounter = 1;

  // Re-draw the canvas with the empty arrays.
  draw();
}

/**
 * Exports the current canvas to a text file.
 *
 * The file contains the nodes' positions and the connections between them.
 * The format is as follows:
 * enableDirectedEdges: {true/false}
 * Node {id}: ({x},{y})
 * ({from}:{to},{value})
 *
 * @returns {void}
 */
function exportData() {
  // Create a string to store the text to export.
  let exportText = `enableDirectedEdges: ${
    document.getElementById("enableDirectedEdges").checked
  }\n`;

  // Iterate over the nodes and connections to create the text.
  nodes.forEach((node) => {
    exportText += `Node ${node.id}: (${node.x},${node.y})\n`;
  });
  edges.forEach((edge) => {
    exportText += `(${edge.from.id}:${edge.to.id},${edge.value})\n`;
  });

  // Create a blob from the string buffer and create a URL to download it.
  const blob = new Blob([exportText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  // Create a fake DOM element to download the file locally on the client.
  const a = document.createElement("a");
  a.href = url;
  a.download = "connections.txt";
  document.body.appendChild(a);
  a.click();

  // Remove the a DOM element.
  document.body.removeChild(a);

  // Delete the Blob data from memory.
  URL.revokeObjectURL(url);
}

/**
 * Imports data from a text file into the canvas.
 *
 * @param {any} event The input event with the file data.
 * @param {string} [content] Optional. If no file is provided, read directly from the provided content here.
 *
 * @returns {void}
 */
function importData(event, content = undefined) {
  function readFileContent(e) {
    const content = e.target.result;

    // Split the content into lines and remove empty lines.
    const lines = content.split("\n").filter((line) => line.trim() !== "");

    // Reset the canvas to remove any previous data.
    resetCanvas();

    // Iterate over the lines to create the nodes and connections.
    try {
      for (const line of lines) {
        // Check for the enableDirectedEdges line
        if (line.startsWith("enableDirectedEdges:")) {
          const enabled = line.split(":")[1].trim() === "true";
          document.getElementById("enableDirectedEdges").checked = enabled;

          checkDirectedEdges();

          continue;
        }

        // Nodes should always go first, if this is a node parse it.
        if (line.startsWith("Node")) {
          // Extract its ID, x, and y coordinates.
          const [idPart, posPart] = line.split(":");

          // Parse the ID into an integer.
          const id = parseInt(idPart.split(" ")[1]);

          // Parse the x and y coordinates into integers.
          const [x, y] = posPart.trim().slice(1, -1).split(",").map(Number);

          // Validate the extracted values from the node.
          if (isNaN(id) || isNaN(x) || isNaN(y))
            throw new Error(`El formato de nodo provisto es invalido: ${line}`);

          // Add the node to the nodes array.
          nodes.push({ id, x, y, radius: 20 });

          // Update the node counter to avoid duplicate IDs if modified later.
          nodeIdCounter = Math.max(nodeIdCounter, id + 1);

          continue;
        }

        // Extract the connections from the line.
        const [fromToPart, valuePart] = line.slice(1, -1).split(",");

        const [from, to] = fromToPart.split(":").map(Number);

        const value = Number(valuePart);

        // Validate the extracted values from the connections.
        if (isNaN(from) || isNaN(to) || isNaN(value))
          throw new Error(`El formato de arista provisto es invalido: ${line}`);

        // Find the parsed nodes these connections point to.
        const fromNode = nodes.find((node) => node.id === from),
          toNode = nodes.find((node) => node.id === to);

        // Add the connection if both nodes exist.
        if (fromNode && toNode)
          edges.push({ from: fromNode, to: toNode, value });
      }
    } catch (error) {
      alert(`Ocurrio un error al intentar importar el archivo: ${error}`);

      resetCanvas();

      return;
    }

    draw();

    checkForm();
  }

  // Allow the process to run with a provided content, if provided.
  if (content !== undefined) {
    return readFileContent({ target: { result: content } });
  }

  // Obtain the file from the input event.
  const file = event.target.files[0];

  // If no file is selected, return.
  if (!file) return;

  // Create a new FileReader to read the file's content.
  const reader = new FileReader();

  // Read its contents to validate the format.
  reader.onload = readFileContent;

  reader.readAsText(file);

  event.target.value = ""; // Reset the file input value to allow re-importing
}
