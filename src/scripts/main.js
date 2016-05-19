/* global d3 */

// Defines variables
const margin = {top: 50, right: 40, bottom: 50, left: 40}
const width = window.innerWidth - margin.left - margin.right
const height = window.innerHeight - margin.top - margin.bottom

let stats = {
  apps: 0,
  containers: 0,
  images: 0
}

let tree = d3.layout.tree()
  .size([height, width - 160])
  .children(d => {
    let children = d.children || d.Layers || d.Containerlist || null
    return children
  })
  .sort((a, b) => {
    return a.Id < b.Id ? -1 : a.Id > b.Id ? 1 : a.Id >= b.Id ? 0 : NaN
  })

let diagonal = d3.svg.diagonal().projection(d => [d.y, d.x])

let svg = d3.select('body').append('svg')
  .attr('width', width)
  .attr('height', height)
  .attr('class', 'container')
  .append('g')
  .attr('transform', 'translate(40, 0)')

// Get the data in JSON format
d3.json('data/testfile.json', (error, response) => {
  if (error) throw error

  // Count the numbers of app, image and containers
  stats = response.reduce((stats, data, index, response) => {
    stats.apps = response.length
    stats.images += data.Layers.length
    data.Layers.forEach((layers) => {
      if (layers.Containerlist) {
        stats.containers += layers.Containerlist.length
      }
    })
    return stats
  }, stats)

  // Update to display statistics
  d3.select('.stats-apps .stats-value').text(stats.apps)
  d3.select('.stats-images .stats-value').text(stats.images)
  d3.select('.stats-containers .stats-value').text(stats.containers)

  // Wrap the data source array into an Object
  let data = {
    name: 'Node',
    children: response
  }

  // Assign data to tree layout
  let nodes = tree.nodes(data)
  let links = tree.links(nodes)
  console.log('nodes', nodes)

  let link = svg.selectAll('path.link')
    .data(links)
    .enter().append('path')
    .attr('class', 'link')
    .attr('d', diagonal)

  let app = svg.selectAll('g.app')
    .data(nodes)
    .enter().append('g')
    .filter(d => d.depth === 0)
    .attr('class', 'app')
    .attr('transform', function (d) { return 'translate(' + d.y + ',' + d.x + ')'; })
    .on('mouseover', d => {
      d3.select('#tooltip')
        .style('left', d.y + 'px')
        .style('top', d.x + 'px')
        .select('#value')
        .html(d.Projectname)

      d3.select('#tooltip').classed('hidden', false)
    })
    .on('mouseout', () => {
      d3.select('#tooltip').classed('hidden', true)
    })

  app.append('circle')
    .attr('r', 10)

  app.append('text')
    .attr('dx', 15)
    .attr('dy', 30)
    .attr('text-anchor', function (d) { return d.children ? 'end' : 'start'; })
    .text(function (d) { return d.Projectname })

  var node = svg.selectAll('g.node')
    .data(nodes)
    .enter().append('g')
    .filter(d => d.depth > 0)
    .attr('class', 'node')
    .attr('transform', d => 'translate(' + d.y + ',' + d.x + ')')
    .classed({
      'node-app': d => d.depth === 1,
      'node-image': d => d.depth === 2,
      'node-container': d => d.depth === 3,
      'is-up': d => d.depth === 3 && d.Status.indexOf('Up') === 0,
      'is-exited': d => d.depth === 3 && d.Status.indexOf('Exited') === 0
    })
    .on('mouseover', d => {
      console.log(d)
      d3.select('#tooltip')
        .style('left', d.y + 'px')
        .style('top', d.x + 'px')
        .select('#tooltip p')
        .text(() => {
          if (d.depth === 1) return d.Projectname
          if (d.depth === 2) return d.Name
          if (d.depth === 3) return d.Id
        })
      d3.select('#tooltip').classed('hidden', false)
    })
    .on('mouseout', function () {
      // Hide the tooltip
      d3.select('#tooltip').classed('hidden', true)
    })

  node.filter(d => d.depth < 3)
    .append('circle')
    .attr('r', 4.5)
  node.filter(d => d.depth === 3)
    .append('polygon')
    .attr('points', '8.5 1 15.6329239 6.18237254 12.9083894 14.5676275 4.09161061 14.5676275 1.36707613 6.18237254')
    .attr('class', 'container-shape')
    .attr('transform', 'translate(-12, -8)')

  // .append('path')
    // .attr('d', 'M57,13.993c0-0.016-0.006-0.03-0.007-0.046c-0.004-0.074-0.013-0.146-0.032-0.216c-0.009-0.03-0.023-0.057-0.035-0.086  c-0.021-0.054-0.041-0.106-0.071-0.155c-0.018-0.03-0.041-0.056-0.061-0.083c-0.032-0.043-0.065-0.085-0.103-0.122  c-0.026-0.025-0.056-0.047-0.085-0.069c-0.027-0.021-0.05-0.046-0.079-0.065c-0.017-0.01-0.036-0.015-0.053-0.024  c-0.014-0.008-0.025-0.02-0.04-0.027l-27-13c-0.284-0.137-0.615-0.132-0.895,0.014l-25,13c-0.011,0.006-0.018,0.015-0.029,0.021  c-0.011,0.006-0.024,0.009-0.036,0.016c-0.034,0.021-0.06,0.049-0.091,0.074c-0.029,0.023-0.06,0.044-0.087,0.07  c-0.038,0.038-0.068,0.08-0.099,0.123c-0.02,0.028-0.044,0.053-0.061,0.083c-0.031,0.053-0.052,0.11-0.072,0.168  c-0.009,0.025-0.022,0.047-0.029,0.073C3.013,13.824,3,13.911,3,14v32c0,0.379,0.214,0.725,0.553,0.895l26,13  c0.015,0.007,0.031,0.004,0.046,0.011C29.728,59.962,29.862,60,30,60s0.273-0.038,0.401-0.095c0.015-0.007,0.032-0.004,0.046-0.011  l26-13C56.786,46.725,57,46.379,57,46V14c0-0.001,0-0.002,0-0.004C57,13.995,57,13.994,57,13.993z M29.017,2.118L53.73,14.017  L30,25.882L6.201,13.983L29.017,2.118z M5,15.618l24,12v29.764l-24-12V15.618z M55,45.382l-24,12V27.618l24-12V45.382z')

  node.append('text')
    .attr('dx', function (d) { return d.children ? -8 : 8 })
    .attr('dy', 3)
    .attr('text-anchor', function (d) { return d.children ? 'end' : 'start'; })
    .text(d => {
      return d.Projectname || d.Name || d.Id
    })
})

d3.select(self.frameElement).style('height', height + 'px')

// var i = 0,
//   duration = 750,
//   root

// var tree = d3.layout.tree()
//   .size([height, width])

// var diagonal = d3.svg.diagonal()
//   .projection(function (d) { return [d.y, d.x]; })

// var svg = d3.select('body').append('svg')
//   .attr('width', width + margin.right + margin.left)
//   .attr('height', height + margin.top + margin.bottom)
//   .append('g')
//   .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

// d3.json('data/flare.json', function (error, flare) {
//   if (error) throw error

//   root = flare
//   root.x0 = height / 2
//   root.y0 = 0

//   function collapse (d) {
//     if (d.children) {
//       d._children = d.children
//       d._children.forEach(collapse)
//       d.children = null
//     }
//   }

//   root.children.forEach(collapse)
//   update(root)
// })

// d3.select(self.frameElement).style('height', '800px')

// function update (source) {
//   // Compute the new tree layout.
//   var nodes = tree.nodes(root).reverse(),
//     links = tree.links(nodes)

//   // Normalize for fixed-depth.
//   nodes.forEach(function (d) { d.y = d.depth * 180; })
//   console.log(nodes)
//   // Update the nodes…
//   var node = svg.selectAll('g.node')
//     .data(nodes, function (d) { return d.id || (d.id = ++i); })

//   // Enter any new nodes at the parent's previous position.
//   var nodeEnter = node.enter().append('g')
//     .attr('class', 'node')
//     .attr('transform', function (d) { return 'translate(' + source.y0 + ',' + source.x0 + ')'; })
//     .on('click', click)

//   nodeEnter.append('circle')
//     .attr('r', 1e-6)
//     .style('fill', function (d) { return d._children ? 'lightsteelblue' : '#fff'; })

//   nodeEnter.append('text')
//     .attr('x', function (d) { return d.children || d._children ? -10 : 10; })
//     .attr('dy', '.35em')
//     .attr('text-anchor', function (d) { return d.children || d._children ? 'end' : 'start'; })
//     .text(function (d) { return d.name; })
//     .style('fill-opacity', 1e-6)

//   // Transition nodes to their new position.
//   var nodeUpdate = node.transition()
//     .duration(duration)
//     .attr('transform', function (d) { return 'translate(' + d.y + ',' + d.x + ')'; })

//   nodeUpdate.select('circle')
//     .attr('r', 4.5)
//     .style('fill', function (d) { return d._children ? 'lightsteelblue' : '#fff'; })

//   nodeUpdate.select('text')
//     .style('fill-opacity', 1)

//   // Transition exiting nodes to the parent's new position.
//   var nodeExit = node.exit().transition()
//     .duration(duration)
//     .attr('transform', function (d) { return 'translate(' + source.y + ',' + source.x + ')'; })
//     .remove()

//   nodeExit.select('circle')
//     .attr('r', 1e-6)

//   nodeExit.select('text')
//     .style('fill-opacity', 1e-6)

//   // Update the links…
//   var link = svg.selectAll('path.link')
//     .data(links, function (d) { return d.target.id; })

//   // Enter any new links at the parent's previous position.
//   link.enter().insert('path', 'g')
//     .attr('class', 'link')
//     .attr('d', function (d) {
//       var o = {x: source.x0, y: source.y0}
//       return diagonal({source: o, target: o})
//     })

//   // Transition links to their new position.
//   link.transition()
//     .duration(duration)
//     .attr('d', diagonal)

//   // Transition exiting nodes to the parent's new position.
//   link.exit().transition()
//     .duration(duration)
//     .attr('d', function (d) {
//       var o = {x: source.x, y: source.y}
//       return diagonal({source: o, target: o})
//     })
//     .remove()

//   // Stash the old positions for transition.
//   nodes.forEach(function (d) {
//     d.x0 = d.x
//     d.y0 = d.y
//   })
// }

// // Toggle children on click.
// function click (d) {
//   if (d.children) {
//     d._children = d.children
//     d.children = null
//   } else {
//     d.children = d._children
//     d._children = null
//   }
//   update(d)
// }
