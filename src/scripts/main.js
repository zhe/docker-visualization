/* global d3, WebSocket, XMLHttpRequest, fetch */

// Defines variables
const margin = {top: 30, right: 40, bottom: 30, left: 40}
const width = window.innerWidth - margin.left - margin.right
const height = window.innerHeight - margin.top - margin.bottom

let nodes
let links
let stats = {
  apps: 0,
  containers: 0,
  images: 0
}

// let drag = d3.behavior.drag()
//   .origin(d => d)
//   .on('dragstart', dragstarted)
//   .on('drag', dragged)
//   .on('dragend', dragended)

let tree = d3.layout.tree()
  .size([height, width - 160])
  .children(d => {
    let children
    if (d.children) {
      children = d.children
    } else if (d.Layers) {
      children = d.Layers
    // d.Layers = null
    // delete d.Layers
    } else if (d.Containerlist) {
      children = d.Containerlist
    // d.Containerlist = null
    // delete d.Containerlist
    }

    return children
  })
  // .sort((a, b) => {
  //   return a.Id < b.Id ? -1 : a.Id > b.Id ? 1 : a.Id >= b.Id ? 0 : NaN
  // })

let diagonal = d3.svg.diagonal().projection(d => [d.y, d.x])

// Define zoom behavier
let zoom = d3.behavior.zoom().scaleExtent([1, 10]).on('zoom', () => {
  svg.attr('transform', 'translate(' + d3.event.translate + ')' + ' scale(' + d3.event.scale + ')')
})

let svg = d3.select('body').append('svg')
  .attr('width', width)
  .attr('height', height)
  .call(zoom)
  .attr('class', 'container')
  .append('g')
  .attr('class', 'content')

let i = 0
let duration = 750
let root

// Get the data in JSON format
const getData = (url) => {
  d3.json(url, (error, response) => {
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

    root = data
    root.x0 = height / 2
    root.y0 = 0

    function collapse (d) {
      if (d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
      }
    }

    // root.children.forEach(normalize)
    root.children.forEach(collapse)
    update(root)
  })
}

// getData('data/online.json')
getData('http://121.41.97.152:9998/crmonitor/project')

d3.select(self.frameElement).style('height', height + 'px')

const normalize = (d) => {
  let result = d.map((value) => {
    if (value.hasOwnProperty('Layers')) {
      value.type = 'app'
      value.name = value.Projectname
      delete value.Layers
      return value
    } else if (value.hasOwnProperty('Containerlist')) {
      value.type = 'image'
      value.name = value.Name
      delete value.Containerlist
      return value
    } else if (value.hasOwnProperty('Hostip')) {
      value.type = 'container'
      value.name = value.Id.slice(0, 8)
      return value
    } else {
      value.type = 'unknown'
      return value
    }
  })
  return result
}

const update = (source) => {
  // Assign data to tree layout
  nodes = tree.nodes(root).reverse()
  links = tree.links(nodes)
  normalize(nodes)

  // Normalize for fixed-depth.
  // nodes.forEach(function (d) { d.y = d.depth * 280 })

  // Update the nodes…
  var node = svg.selectAll('g.node')
    .data(nodes, function (d) { return d.id || (d.id = ++i) })
  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append('g')
    .attr('class', 'node')
    .attr('data-nodeId', d => d.id)
    .classed({
      'node-app': d => d.type === 'app',
      'node-image': d => d.type === 'image',
      'node-container': d => d.type === 'container',
      'is-up': d => d.type === 'container' && d.Status.indexOf('Up') === 0,
      'is-exited': d => d.type === 'container' && d.Status.indexOf('Exited') === 0
    })
    .attr('transform', function (d) { return 'translate(' + source.y0 + ',' + source.x0 + ')'; })
    .on('click', click)
    .on('mouseover', (d) => {
      let cache = []
      d3.select('#tooltip')
        .style('left', (d.y + 50) + 'px')
        .style('top', (d.x + 50) + 'px')
        .select('#tooltip pre')
        .text(JSON.stringify(d, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
              // Circular reference found, discard key
              return
            }
            // Store value in our collection
            cache.push(value)
          }
          return value
        }, 2))

      cache = null
      // Show the tooltip
      d3.select('#tooltip').classed('hidden', false)
    })
    .on('mouseout', () => {
      // Hide the tooltip
      d3.select('#tooltip').classed('hidden', true)
    })

  nodeEnter
    .filter(d => d.type === 'container')
    .append('polygon')
    .attr('points', '6 0 11.1961524 3 11.1961524 9 6 12 0.803847577 9 0.803847577 3')
    .attr('transform', function (d) { return 'translate(-6, -6)' })
    .attr('class', 'node-shape')
    .style('fill', function (d) { return d._children ? 'lightsteelblue' : '#fff' })

  nodeEnter
    .filter(d => d.type === 'app')
    .append('polygon')
    .attr('points', '6 0 12 6 6 12 0 6')
    .attr('transform', function (d) { return 'translate(-6, -6)' })
    .attr('class', 'node-shape')
    .style('fill', function (d) { return d._children ? 'lightsteelblue' : '#fff' })

  nodeEnter
    .filter(d => d.type === 'image' || d.type === 'unknown')
    .append('circle')
    .attr('r', 1e-6)
    .attr('class', 'node-shape')
    .style('fill', function (d) { return d._children ? 'lightsteelblue' : '#fff' })

  nodeEnter.append('text')
    .attr('x', function (d) { return d.children || d._children ? -10 : 10; })
    .attr('dy', '.35em')
    .attr('text-anchor', function (d) { return d.children || d._children ? 'end' : 'start'; })
    .text(function (d) { return d.name })
    .style('fill-opacity', 1e-6)

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
    .duration(duration)
    .attr('transform', function (d) { return 'translate(' + d.y + ',' + d.x + ')'; })

  nodeUpdate.select('circle')
    .attr('r', 4.5)
    .style('fill', function (d) { return d._children ? 'lightsteelblue' : '#fff'; })

  nodeUpdate.select('text')
    .style('fill-opacity', 1)

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
    .duration(duration)
    .attr('transform', function (d) { return 'translate(' + source.y + ',' + source.x + ')'; })
    .remove()

  nodeExit.select('circle')
    .attr('r', 1e-6)

  nodeExit.select('text')
    .style('fill-opacity', 1e-6)

  // Update the links…
  var link = svg.selectAll('path.link')
    .data(links, function (d) { return d.target.id; })

  // Enter any new links at the parent's previous position.
  link.enter().insert('path', 'g')
    .attr('class', 'link')
    .attr('data-nodeId', d => d.target.id)
    .classed({
      'is-up': d => d.target.type === 'container' && d.target.Status.indexOf('Up') > -1,
      'is-exited': d => d.target.type === 'container' && d.target.Status.indexOf('Exited') > -1
    })
    .attr('d', function (d) {
      var o = {x: source.x0, y: source.y0}
      return diagonal({source: o, target: o})
    })

  // Transition links to their new position.
  link.transition()
    .duration(duration)
    .attr('d', diagonal)

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
    .duration(duration)
    .attr('d', function (d) {
      var o = {x: source.x, y: source.y}
      return diagonal({source: o, target: o})
    })
    .remove()

  // Stash the old positions for transition.
  nodes.forEach(function (d) {
    d.x0 = d.x
    d.y0 = d.y
  })
}

// Toggle children on click.
function click (d) {
  if (d.children) {
    d._children = d.children
    d.children = null
  } else {
    d.children = d._children
    d._children = null
  }
  update(d)
}

const setup = () => {
  let ws = new WebSocket('ws://104.236.190.90:5000/conn')

  // Listen for the connection open event then call the sendMessage function
  ws.onopen = (evt) => {
    console.log('CONNECTED')
    ws.send('Hello')
  }

  // Listen for the close connection event
  ws.onclose = (evt) => {
    console.log('DISCONNECTED')
  }

  // Listen for connection errors
  ws.onerror = (evt) => {
    console.log('ERROR: ' + evt.data)
  }

  // Listen for new messages arriving at the client
  ws.onmessage = (evt) => {
    console.log('MESSAGE RECEIVED: ' + evt.data)
    // console.log(JSON.parse(evt.data))
    let response = JSON.parse(evt.data)
    if (response.event === 'delete') {
      destroyContainer(response)
    } else if (response.event === 'set') {
      createContainer(response)
    }
  }
}

// The window.addEventListener triggers when the web page is loaded
// then call the setup function window.addEventListener("load", setup, false)
window.addEventListener('load', setup, false)

// Upload compose.yml file

let form = document.getElementById('file-form')
let fileSelect = document.getElementById('file-select')
let uploadButton = document.getElementById('upload-button')

uploadButton.addEventListener('click', (e) => {
  e.preventDefault()

  let input = document.querySelector('input[type="file"]')

  let data = new FormData()
  data.append('composefile', input.files[0])
  data.append('projectname', 'projectd')
  fetch('http://121.41.97.152:9998/crmonitor/register', {
    method: 'POST',
    body: data
  })
    .then(response => {
      getData('http://121.41.97.152:9998/crmonitor/project')
    })
})

// fetch('http://121.41.97.152:9998/crmonitor/project')
//   .then(response => response.json())
//   .then(json => {
//     console.log('parsed json', json)
//   })
//   .catch(ex => {
//     console.log('parsing failed', ex)
//   })

// // http://121.41.97.152:9998/crmonitor/project
// const fetchData = () => {
// }

let btnAnother = document.querySelector('.btn-another')
let btnCreate = document.querySelector('.btn-create')
// let btnScale = document.querySelector('.btn-scale')
// let btnRefresh = document.querySelector('.btn-refresh')

btnAnother.addEventListener('click', () => {
  getData('/data/testfile.json')
})

btnCreate.addEventListener('click', () => {
  fetch('/data/create.json')
    .then(response => response.json())
    .then(json => {
      root.children.push(json)
    })
  update(root)
})

// btnScale.addEventListener('click', () => {
//   console.log('obj')
//   console.log(nodes)
//   let data = { Hostip: '10.211.55.15', container_id: '30595b1796ba0a24ef8901041ed9c4515e61a591c7485a5a548994dabfcbd31d', event: 'destroy', project_name: 'projectd', service_name: 'db', image_name: 'mysql'}
//   console.log(root)
//   root.children.forEach(project => {
//     if (project.Projectname === data.project_name) {
//       project.children.forEach(image => {
//         if (image.Name === data.service_name) {
//           image.children = image.children.filter(child => child.Id !== data.container_id)
//         }
//       })
//     }
//   })
//   update(root)
// })

const destroyContainer = (data) => {
  root.children.forEach(project => {
    if (project.Projectname === data.project_name) {
      project.children.forEach(image => {
        if (image.Imagename === data.image_name) {
          image.children = image.children.filter(child => child.Id !== data.container_id)
        }
      })
    }
  })
  update(root)
}

const createContainer = (data) => {
  root.children.forEach(project => {
    if (project.Projectname === data.project_name) {
      project.children.forEach(image => {
        if (image.Imagename === data.image_name) {
          data.Hostip = '10.211.55.15'
          data.Id = data.container_id
          data.Status = 'Up 1 second ago'
          image.children.push(data)
        }
      })
    }
  })
  update(root)
}
