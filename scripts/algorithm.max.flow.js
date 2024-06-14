/** Assigns an event listener to the checkbox to redraw the canvas when its value changes. */
document
  .getElementById("enableDirectedEdges")
  .addEventListener("change", checkDirectedEdges);

/**
 * If directed edges are enabled, enables fields to calculate max flow.
 *
 * @returns {void}
 */
function checkDirectedEdges() {
  const directedEdges = document.getElementById("enableDirectedEdges").checked;

  document.getElementById("maxFlowSourceNode").disabled = !directedEdges;
  document.getElementById("maxFlowSinkNode").disabled = !directedEdges;
  document.getElementById("runMaxFlow").disabled = !directedEdges;
}

function runMaxFlow() {
  // Obtain the values from the input and sink nodes.
  const sourceNode = Number(document.getElementById("maxFlowSourceNode").value),
    sinkNode = Number(document.getElementById("maxFlowSinkNode").value);

  // If empty, return an error.
  if (sourceNode === "" || sinkNode === "" || !sourceNode || !sinkNode) {
    alert("Porfavor introduzca nodos de entrada/salida.");
    return;
  }

  // If they're the same, return an error.
  if (sourceNode === sinkNode) {
    alert("El nodo de entrada no puede ser igual al nodo de salida.");
    return;
  }

  // If either of the nodes don't exist, return an error.
  const sNode = nodes.find((n) => n.id === sourceNode),
    tNode = nodes.find((n) => n.id === sinkNode);

  if (!sNode || !tNode) {
    alert("Los nodos de entrada/salida no existen.");
    return;
  }

  // Execute the algorithm.
  const result = fordFulkerson(edges, sNode, tNode);

  // Set the result on the DOM input.
  document.getElementById("maxFlowResult").value = result;
}

checkDirectedEdges();
