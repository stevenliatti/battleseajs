function drawShips(svg) {
	let enableContextMenuEvent = true;
	let takenCells  = [];
	drag = d3.behavior.drag()
		.on("drag", function(d) {
			d.x += d3.event.dx;
			d.y += d3.event.dy;
			if (d.y + d.height <= mapW) {
				d.state =  "in";
			}
			defineLimits(d, d3.select(this));
			console.log('dragging');
		})
		.on('dragstart', function(d){
			removeOldCells(d);
			d.cells = [];
			console.log('drag start');
		})
		.on('dragend', function(d, i){
			if (d.state == "in") {
				magnet(d, d3.select(this));
				updateShipCells(d, d3.select(this));
			}
			console.log('drag end');
		});

	svg.selectAll('.ship')
		.data(shipsData)
		.enter()
		.append('image')
		.attr("id", function (d) { return "ship" + d.id; })
		.attr('x', function(d) { return d.x; })
		.attr('y', function(d) { return d.y; })
		.attr('width', function(d) { return d.width; }) 
		.attr('height', function(d) { return d.height; })
		.attr("xlink:href", function(d) { return d.img[d.dir]; })
		.attr("class", "ship")
		.call(drag)
		.on('click', function() {
			console.log('clicked');
		})
		.on("contextmenu", function(d) { changeDirection(d, d3.select(this)); });

	function changeDirection(ship, object) {
		d3.event.preventDefault();
		if (enableContextMenuEvent) {
			if (ship.dir == "h") 
				ship.dir = "v";
			else
				ship.dir = "h";
			object.attr("xlink:href", ship.img[ship.dir]);
			ship.x += ship.width / 2 - ship.height / 2;
			ship.y -= ship.width / 2 - ship.height / 2;
			let aux = ship.width;
			ship.width = ship.height;
			ship.height = aux;
			object.attr("width", ship.width).attr("height", ship.height);
			magnet(ship, object);
			defineLimits(ship, object);
			updateShipCells(ship, object);
		}
	};

	function randomDirection(ship, object) {
		let rn = getRndInteger(0, 100);
		let newDir = "h";
		if (rn < 50) {
			newDir = "v";
		}
		if (newDir !== ship.dir) {
			ship.dir = newDir;
			object.attr("xlink:href", ship.img[ship.dir]);
			ship.x += ship.width / 2 - ship.height / 2;
			ship.y -= ship.width / 2 - ship.height / 2;
			let aux = ship.width;
			ship.width = ship.height;
			ship.height = aux;
		}
	};

	let defineLimits = function (d, object) {
		if (d.state == "in") {
			if (d.x < 0) {
				d.x = 0;
			}
			if (d.x + d.width > mapW) {
				d.x = mapW - d.width;
			}
			if (d.y < 0) {
				d.y = 0;
			}
			if (d.y + d.height > mapW) {
				d.y = mapW - d.height;
			}
		}
		updateView(d, object);
	};

	let magnet = function(d, object) {
		d.x = Math.round(d.x / z) * z;
		d.y = Math.round(d.y / z) * z;
		updateView(d, object);
	};

	let updateShipCells = function(ship, object) {
		// removing old cells
		removeOldCells(ship);

		let firstShipCell = ship.x / z + ship.y / z * 10;
		ship.cells = [];
		if (ship.dir == "h") {
			d3.range(Math.floor(ship.width / z)).map(function(i) {
				ship.cells.push(firstShipCell + i);
			});
		}
		if (ship.dir == "v") {
			d3.range(Math.floor(ship.height / z)).map(function(i) {
				ship.cells.push(firstShipCell + i * 10);
			});
		}
		// adding new cells
		ship.valid = true;
		ship.cells.forEach(cell => ship.valid &= (takenCells.indexOf(cell) == -1));
		if (ship.valid) {
			ship.cells.forEach(cell => takenCells.push(cell));
		} else {
			ship.cells = [];
		}

		getReady();
	};

	let removeOldCells = function(ship) {
		let oldCells = clone(ship.cells);
		oldCells.forEach(cell => takenCells.forEach(function(d, i) {
			if (cell === d) {
				takenCells.splice(i, 1);
			}
		}));
	};

	let getReady = function () {
		let unvalidShips = shipsData.filter(e => !e.valid || e.valid == undefined);
		if (unvalidShips.length == 0) {
			d3.selectAll("#readyButton").remove();
			d3.select("#buttonTd")
				.append("button")
				.attr("id", "readyButton")
				.attr("class", "btn btn-primary btn-sm")
				.on("click", function() {
					drag.on("drag", null);
					drag.on("dragstart", null);
					drag.on("dragend", null);
					svg.selectAll('.ship').selectAll('image').on("contextmenu", null);
					sendData();
					d3.select("#buttonTd").selectAll("button").remove();
					enableContextMenuEvent = false;
				})
				.html("Ready");
		} else {
			d3.select("#buttonTd")
				.selectAll("#readyButton").remove();
		}
	};

	;(function(){
		d3.select("#buttonTd")
			.append("button")
			.html("Random")
			.attr("class", "btn btn-secondary btn-sm")
			.attr("id", "randomButton")
			.on("click", function() {
				takenCells  = [];
				randomShipPositions();
				console.log(takenCells);
			});
	})();

	function randomShipPositions() {
		let usedCells = [];
		shipsData.forEach(function(ship) {
			let validCells = false;
			while (!validCells) {
				randomDirection(ship, d3.select("#ship" + ship.id));
				ship.x = getRndInteger(0, mapW - ship.width);
				ship.y = getRndInteger(0, mapW - ship.height);
				ship.x = Math.round(ship.x / z) * z;
				ship.y = Math.round(ship.y / z) * z;
				let firstCell = Math.floor(ship.x / z) + Math.floor(ship.y / z) * 10;
				let cells = [];
				if (ship.dir === "h") {
					d3.range(ship.size).forEach(i => cells.push(firstCell + i));
				} else {
					d3.range(ship.size).forEach(i => cells.push(firstCell + i * 10));
				}
				let i = 0;
				while (i < ship.size) {
					if (usedCells.indexOf(cells[i]) == -1) {
						usedCells.push(cells[i]);
					} else {
						break;
					}
					i += 1;
				}
				if (i === ship.size) {
					validCells = true;
					ship.cells = cells;
					cells.forEach(cell => takenCells.push(cell));
				}
			}
			ship.valid = true;
			d3.select("#ship" + ship.id)
				.attr("x", ship.x)
				.attr("y", ship.y)
				.attr("width", ship.width)
				.attr("height", ship.height);
		});
		getReady();
		console.log(takenCells);
	}
}

/*
	Function ( min : string, max : string )

	Return Type: integer

	Description: returns a random number between min and max (both included)
*/
function getRndInteger(min, max) {
	return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function updateView(ship, shipView) {
	shipView.attr("x", ship.x).attr("y", ship.y);
}