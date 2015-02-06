(function(queryTablemaps, $, undefined) {

	// Matt's Fusion tables and API key; don't mess with this
	var CENSUS_TRACTS_TABLE = '1E45OeyKEC8TBt_Jtau0HkiLycxjPcLS_SAgejFdt';
	var COMMUNITY_AREAS_TABLE = '19403tp7_IakdCX0soN031hMap7jPZV3uPbNhI9ME';
	var API_KEY = 'AIzaSyB_Idpo8GuOvdaIU7VtOsk7pTargR6rEFw';

	var communityPolys; // community area polygons
	var censusPolys; // census tract polygons
	var map = null; // Google map object

	// Predicates to indicate whether community area / census polys are ready
	// for rendering
	var communitiesReady = false;
	var censusReady = false;

	function queryFusionTable(tableId, successCallback) {

		// Construct the Fusion Table query
		var query = 'SELECT id, name, geometry FROM ' + tableId;
		var url = [ 'https://www.googleapis.com/fusiontables/v1/query' ];
		url.push('?sql=' + encodeURIComponent(query));
		url.push('&key=' + API_KEY);
		url.push('&callback=?');

		// Fire it off; build polys when complete
		$.ajax({
			url : url.join(''),
			dataType : 'jsonp',
			success : function(data) {
				buildPolygons(data, successCallback);
			}
		});
	}

	function initialize() {
		var options = {
			center : new google.maps.LatLng(41.8369, -87.6847),
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			zoom : 11
		};

		map = new google.maps.Map(document.getElementById('map-canvas'),
				options);

		queryFusionTable(COMMUNITY_AREAS_TABLE, onCommunityPolysReady);
		queryFusionTable(CENSUS_TRACTS_TABLE, onCensusPolysReady);
	}

	maps.getMap = function() {
		return map;
	};

	function onCensusPolysReady(polys) {
		censusPolys = polys;
		censusReady = true;
	}

	function onCommunityPolysReady(polys) {
		communityPolys = polys;
		communitiesReady = true;

		showPolys(communityPolys);
	}

	function getWeightForArea(areaId) {
		// TODO: Query datasource for accessibility index
		return Math.random() + .25;
	}

	function showPolys(polys) {
		polys.forEach(function(poly) {
			poly.setMap(maps.getMap());
		});
	}

	function hidePolys(polys) {
		polys.forEach(function(poly) {
			poly.setMap(null);
		});
	}

	function buildPolygons(data, successCallback) {

		var rows = data['rows'];
		var polys = [];

		for ( var i in rows) {
			var newCoordinates = [];
			var areaId = rows[i][0];
			var areaName = rows[i][1].toLowerCase();
			var geometries = rows[i][2]['geometries'];

			if (geometries) {
				for ( var j in geometries) {
					newCoordinates.push(constructNewCoordinates(geometries[j]));
				}
			} else {
				newCoordinates = constructNewCoordinates(rows[i][1]['geometry']);
			}

			var poly = new google.maps.Polygon({
				paths : newCoordinates,
				strokeColor : '#ffffff',
				strokeOpacity : 1,
				strokeWeight : 2,
				fillColor : '#DB944D',
				fillOpacity : getWeightForArea(areaId),
				areaId : areaId,
				areaName : areaName
			});

			google.maps.event.addListener(poly, 'mouseover', function() {
				$(".area-name").html(this.areaName);
				this.setOptions({
					strokeOpacity : 1,
					strokeWeight : 6,
				});
			});
			google.maps.event.addListener(poly, 'mouseout', function() {
				this.setOptions({
					strokeOpacity : 1,
					strokeWeight : 1,
				});
			});

			polys.push(poly);

		}

		successCallback(polys);

		// poly.setMap(map);
		// var thisarea =
		// $($(areaId).find('li').get(3)).find(".atr-value").text();
		// areas += thisarea + "\n";
		// console.log(areas);
	}

	function constructNewCoordinates(polygon) {
		var newCoordinates = [];
		var coordinates = polygon['coordinates'][0];
		for ( var i in coordinates) {
			newCoordinates.push(new google.maps.LatLng(coordinates[i][1],
					coordinates[i][0]));
		}
		return newCoordinates;
	}

	maps.init = function() {
		initialize();
	};

	maps.areCensusTractsReady = function() {
		return censusReady;
	};

	maps.areCommunitiesReady = function() {
		return communitiesReady;
	};

	maps.showCommunities = function() {
		if (maps.areCommunitiesReady()) {
			showPolys(communityPolys);
			hidePolys(censusPolys);
		}
	};

	maps.showCensusTracts = function() {
		if (maps.areCensusTractsReady()) {
			showPolys(censusPolys);
			hidePolys(communityPolys);
		}
	};

}(window.maps = window.maps || {}, jQuery));
