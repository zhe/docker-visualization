/* global d3 */

const width = 960
const height = 800
let stats = {
  apps: 0,
  containers: 0,
  images: 0
}

var tree = d3.layout.tree()
  .size([height, width - 160])
  .children(d => {
    // (!d.Layers || d.Layers.length === 0) ? null : d.Layers

    let children = d.children || d.Layers || d.Containerlist || null
    return children
  })

var diagonal = d3.svg.diagonal().projection(d => [d.y, d.x])

var svg = d3.select('body').append('svg')
  .attr('width', width)
  .attr('height', height)
  .append('g')
  .attr('transform', 'translate(40,0)')

d3.json('data/testfile.json', (error, response) => {
  if (error) throw error

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

  console.log(stats)

  let data = {
    name: 'Node',
    children: response
  }
  console.log(data)

  console.log(data)

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

  node.append('circle')
    .attr('r', 4.5)

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
