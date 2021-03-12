$(document).ready(function(){
  $("#success").fadeIn();
  setTimeout(function() { $("#success").fadeOut();}, 9000);
  //token para acceder a Tile de Mapbox.
  L.mapbox.accessToken = 'pk.eyJ1IjoiZ2VvaW5ub3ZhcmUiLCJhIjoiY2tlOHIxY2dmMXoyMzM3bjd5dzR1d3lyaSJ9.u93e-yNDr-uqT4-rT722Hg'
  /*var BingKey = ""*/
  //CAPAS BASE//
  var gglh = new L.Google('HYBRID', {maxZoom: 23});
  var ggte = new L.Google('TERRAIN', {maxZoom: 23});
  /*var bing = new L.BingLayer(BingKey);*/ 
  var mapbox_sat = L.mapbox.tileLayer('mapbox.satellite')
  //CAPAS//
  var cuencaStyle = {
      "color": "#b30000",
      "weight": 4, 
      "fillColor": "#0087b3",
      "fillOpacity": 0.1
  };
  var cuerposAguaStyle = {
      "color": "#00c2ff",
      "weight": 2,
      "opacity": 0.5,
      /*"dashArray": '20,15',*/
      "fillColor": "#00c2ff",
      "fillOpacity": 0.2,  
  };
  var corrientesStyle = function(feature) {
          switch (feature.properties.condicion) {
              case 'INTERMITENTE': return {color: "#0042ff", "weight": 1, "opacity": 0.6, "dashArray": '20,15'};
              case 'PERENNE':   return {color: "#0042ff", "weight": 3, "opacity": 0.6};
          }
      }
  var uploadDataStyle = {
        color:'red', 
        opacity: 1.0, 
        fillOpacity: 0.2, 
        weight: 1, 
        clickable: false
      };
  var microcuenca_temaca = new L.geoJson(null, {style: cuencaStyle});
  var corrientes_topo50k = new L.geoJson(null, {style: corrientesStyle});
  var cuerpos_agua_topo50k = new L.geoJson(null, {style: cuerposAguaStyle});
  $.getJSON("static/data/Microcuenca_Temaca.geojson", function(data){
     $(data.features).each(function(key, data) {
            microcuenca_temaca.addData(data);
        });
    }); 
  $.getJSON("static/data/Cuerpo_de_agua_Topo50k.geojson", function(data) {
      $(data.features).each(function(key, data) {
            cuerpos_agua_topo50k.addData(data);
        });
    });  
  $.getJSON("static/data/Corriente_agua_Topo50k.geojson", function(data) {
      $(data.features).each(function(key, data) {
            corrientes_topo50k.addData(data);
        });
    });  
  var map = L.mapbox.map('map', null).setView([21.1883, -102.7020], 13);
  markerList = document.getElementById('marker-list');
  var baseLayers = {
          "Imagen de satélite": mapbox_sat,
          // "Mapa topográfico": mapbox_outdoors,
          "Google topográfico ": ggte,
          "Google satélite": gglh,
          /*"Bing Satélite": bing,*/
        };
   var overLayers = {
        "Corrientes de agua (50k)": corrientes_topo50k,
        "Cuerpos de agua (50k)": cuerpos_agua_topo50k,
        "Microcuenca Temacapulín": microcuenca_temaca,
   }
  L.control.coordinates({
      position : 'bottomleft',
      labelTemplateLat:"Latitud: {y}",
      labelTemplateLng:"Longitud: {x},",
      useLatLngOrder:true
  }).addTo(map);
  L.control.coordinates({
      position : 'bottomleft',
      useDMS:true,
      labelTemplateLat:"N {y},",
      labelTemplateLng:"E {x}",
      useLatLngOrder:true
  }).addTo(map);
  L.control.scale().addTo(map);
  var layerswitcher = L.control.layers(baseLayers, overLayers , {position: "topleft"}).addTo(map);
  var controlLoader = L.Control.fileLayerLoad({
      fitBounds: true,
      addToMap: true,
      layerOptions: {style: uploadDataStyle,
                     pointToLayer: function (data, latlng) {
                        return L.circleMarker(latlng, {style: uploadDataStyle});
                     }},
      fileSizeLimit: 1024,
  }).addTo(map);
  controlLoader.loader.on('data:loaded', function (e) {
      // Add to map layer switcher
      layerswitcher.addOverlay(e.layer, e.filename);
  });
  map.addLayer(mapbox_sat);
  map.addLayer(microcuenca_temaca);
  datosHidro = null;
  loadAllData();

  function removeData(){
      map.removeLayer(datosHidro);
    };


  function loadAllData(){
    $('#spinner').show()
    $.getJSON("static/data/Datos_Hidrologicos_muestreo.geojson", function(data) { $('#spinner').hide();
          datosHidro = L.geoJson(data,{
            onEachFeature: function (feature, layer) {
              var prop = feature.properties;
              layer.bindPopup('<h3>' + prop.descripcion + '</h3><div>' + 
                "<table class='table table-condensed table-hover' align='center' ><tr><td><h6>Elevación: </td><td><h6>" + '&nbsp;' + prop.elevacion + "</h6></td></tr>"+
                    "<tr><td><h6>Temperatura: </h6></td><td><h6>" + '&nbsp;' + prop.temperatura + "</h6></td></tr>"+
                    "<tr><td><h6>Nivel Estático: </h6></td><td><h6>" + '&nbsp;' + prop.nivel_estatico + "</h6></td></tr>"+
                    "</table>"+ '</div>');
              item = markerList.appendChild(document.createElement('li'));
              item.innerHTML = prop.descripcion;
              item.onclick = function() {
                map.setView(layer.getLatLng(), 18);
                layer.openPopup();
                };
            },
            pointToLayer: L.mapbox.marker.style,
            style: function(feature) { return feature.properties; }
          }).addTo(map);
            datosHidro.on('mouseover', function(e) {
                e.layer.openPopup();
              });
            datosHidro.on('mouseout', function(e) {
                e.layer.closePopup();
              });
      })
    };

  $("#pozosBtn").click(function() {
      var pozos = null;
      removeData();
      $('#hideBtn').removeClass('active');
      $('#allBtn').removeClass('active');
      $('#manantialesBtn').removeClass('active');
      $('#riachuelosBtn').removeClass('active');
      $('#pozosBtn').addClass('active');
      $('#marker-list li').remove();

        $.getJSON("static/data/Datos_Hidrologicos_muestreo.geojson", function(data) {
          datosHidro = L.geoJson(data,{
            onEachFeature: function (feature, layer) {
              var prop = feature.properties;
              layer.bindPopup('<h3>' + prop.nombre + '</h3><div>' + 
                "<table class='table table-condensed table-hover' align='center' ><tr><td><h6>Elevación: </td><td><h6>" + '&nbsp;' + prop.elevacion + "</h6></td></tr>"+
                    "<tr><td><h6>Temperatura: </h6></td><td><h6>" + '&nbsp;' + prop.temperatura + "</h6></td></tr>"+
                    "<tr><td><h6>Nivel Estático: </h6></td><td><h6>" + '&nbsp;' + prop.nivel_estatico + "</h6></td></tr>"+
                    "</table>"+ '</div>');
              item = markerList.appendChild(document.createElement('li'));
              item.innerHTML = feature.properties.nombre;
              item.onclick = function() {
                map.setView(layer.getLatLng(), 18);
                layer.openPopup();
                };
            },
              pointToLayer: L.mapbox.marker.style,
              style: function(feature) { 
                return feature.properties; 
            },
              filter: function (feature, layer) {
                return feature.properties.tipo == "Pozo";
            }
          }).addTo(map);
            datosHidro.on('mouseover', function(e) {
                e.layer.openPopup();
              });
            datosHidro.on('mouseout', function(e) {
                e.layer.closePopup();
              });
          
      });
      pozos = datosHidro.getBounds();
      map.fitBounds(pozos, {padding: [100,100]});
    });

  $("#manantialesBtn").click(function() {
      var manantiales = null;
      removeData();
      $('#hideBtn').removeClass('active');
      $('#allBtn').removeClass('active');
      $('#pozosBtn').removeClass('active');
      $('#riachuelosBtn').removeClass('active');
      $('#manantialesBtn').addClass('active');
      $('#marker-list li').remove();

        $.getJSON("static/data/Datos_Hidrologicos_muestreo.geojson", function(data) {
          datosHidro = L.geoJson(data,{
            onEachFeature: function (feature, layer) {
              var prop = feature.properties;
              layer.bindPopup('<h3>' + prop.descripcion + '</h3><div>' + 
                "<table class='table table-condensed table-hover' align='center' ><tr><td><h6>Elevación: </td><td><h6>" + '&nbsp;' + prop.elevacion + "</h6></td></tr>"+
                    "<tr><td><h6>Temperatura: </h6></td><td><h6>" + '&nbsp;' + prop.temperatura + "</h6></td></tr>"+
                    "<tr><td><h6>Nivel Estático: </h6></td><td><h6>" + '&nbsp;' + prop.nivel_estatico + "</h6></td></tr>"+
                    "</table>"+ '</div>');
              item = markerList.appendChild(document.createElement('li'));
              item.innerHTML = prop.descripcion;
              item.onclick = function() {
                map.setView(layer.getLatLng(), 18);
                layer.openPopup();
                };
            },
              pointToLayer: L.mapbox.marker.style,
              style: function(feature) { 
                return feature.properties; 
            },
              filter: function (feature, layer) {
                return feature.properties.tipo == "Manantial" || feature.properties.tipo == "Manantial (tubería)";
            }
          }).addTo(map);
            datosHidro.on('mouseover', function(e) {
                e.layer.openPopup();
              });
            datosHidro.on('mouseout', function(e) {
                e.layer.closePopup();
              });
      });
      manantiales = datosHidro.getBounds();
      map.fitBounds(manantiales);
    });

  $("#riachuelosBtn").click(function() {
        var rias = null;
        removeData();
        $('#hideBtn').removeClass('active');
        $('#allBtn').removeClass('active');
        $('#pozosBtn').removeClass('active');
        $('#manantialesBtn').removeClass('active');
        $('#riachuelosBtn').addClass('active');
        $('#marker-list li').remove();

          $.getJSON("static/data/Datos_Hidrologicos_muestreo.geojson", function(data) {
            datosHidro = L.geoJson(data,{
              onEachFeature: function (feature, layer) {
                var prop = feature.properties;
                layer.bindPopup('<h3>' + prop.descripcion + '</h3><div>' + 
                  "<table class='table table-condensed table-hover' align='center' ><tr><td><h6>Elevación: </td><td><h6>" + '&nbsp;' + prop.elevacion + "</h6></td></tr>"+
                      "<tr><td><h6>Temperatura: </h6></td><td><h6>" + '&nbsp;' + prop.temperatura + "</h6></td></tr>"+
                      "<tr><td><h6>Nivel Estático: </h6></td><td><h6>" + '&nbsp;' + prop.nivel_estatico + "</h6></td></tr>"+
                      "</table>"+ '</div>');
                item = markerList.appendChild(document.createElement('li'));
                item.innerHTML = prop.descripcion;
                item.onclick = function() {
                  map.setView(layer.getLatLng(), 18);
                  layer.openPopup();
                  };
              },
                pointToLayer: L.mapbox.marker.style,
                style: function(feature) { 
                  return feature.properties; 
              },
                filter: function (feature, layer) {
                  return feature.properties.tipo == "Riachuelo" || feature.properties.tipo == "Río";
              }
            }).addTo(map);
              datosHidro.on('mouseover', function(e) {
                  e.layer.openPopup();
                });
              datosHidro.on('mouseout', function(e) {
                  e.layer.closePopup();
                });
        });
        rias = datosHidro.getBounds();
        map.fitBounds(rias, {padding: [100,100]});
      });

  $('#allBtn').click(function(){
        removeData();
        $('#hideBtn').removeClass('active');
        $('#pozosBtn').removeClass('active');
        $('#manantialesBtn').removeClass('active');
        $('#riachuelosBtn').removeClass('active');
        $('#allBtn').addClass('active');
        $('#marker-list li').remove();
        loadAllData();
       });

  $('#hideBtn').click(function(){
        $('#allBtn').removeClass('active');
        $('#pozosBtn').removeClass('active');
        $('#manantialesBtn').removeClass('active');
        $('#riachuelosBtn').removeClass('active');
        $('#hideBtn').addClass('active');
        $('#marker-list li').remove();
        removeData();
       });
  });