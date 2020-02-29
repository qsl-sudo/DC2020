///////////data input
var dataSet;
var currentDateSetName;
var plotData = [];
var flowData = [];
var locArr = [];
var dateArr = [];
var timeArr = [];
var currentMode = 1;

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

$(document).ready(function () {
  $("#predictPanel").hide();
  $('#btnReset').hide();
  $('#vis').hide();
  $('#grid').hide();
  $('input[type="file"]').change(function (e) {
    currentDateSetName = e.target.files[0].name;
    $('#currentFileName').text(currentDateSetName);
  });
  $('#datepickerPred').datepicker({
    uiLibrary: 'bootstrap4',
    // iconsLibrary: 'fontawesome',
    // icons:{ rightIcon: '<i class="far fa-calendar">icon</i>'
    // },
    showOnFocus: true,
    showRightIcon: false,
    value: "03/01/2020",
    minDate: "03/01/2020"

  });




});


function readPlotData(day, loc) {
  plotData.length = 0;
  dataSet.forEach(function (item, index) {
    if (item.time.toLocaleDateString() == day && loc == item.location) {
      plotData.push({
        "series": "pedestrians",
        "x": item.time.toTimeString().split(' ')[0].substr(0, 5),
        "y": item.pedestrians
      }, {
        "series": "trucks",
        "x": item.time.toTimeString().split(' ')[0].substr(0, 5),
        "y": item.trucks
      }, {
        "series": "buses",
        "x": item.time.toTimeString().split(' ')[0].substr(0, 5),
        "y": item.buses
      }, {
        "series": "cars",
        "x": item.time.toTimeString().split(' ')[0].substr(0, 5),
        "y": item.cars
      }, {
        "series": "bicyclists",
        "x": item.time.toTimeString().split(' ')[0].substr(0, 5),
        "y": item.bicyclists
      });

    }
  });
}

function uploadData() {
  currentMode = 1;
  
  $('input[type=file]').parse({
    config: {
      header: true,
      dynamicTyping: true,
      complete: function (results) {
        initGui(results.data);
      }
    },
    before: function (file, inputElem) {

      // executed before parsing each file begins;
      // what you return here controls the flow
    },
    error: function (err, file, inputElem, reason) {
      //console.log(err, file, inputElem, reason);// executed if an error occurs while loading the file,
      // or if before callback aborted for some reason
    },
    complete: function () {

      // executed after all files are complete
    }
  });
}

function goPredict() {
  currentMode = 2;
  $("#uploadPanel").hide();
  $("#predictPanel").show();
  $("#mainWindow").css({background: '#1b1f27'});

}

function predictData() {

  var predictDataSet = dayPredict($('#datepickerPred').val(), $('#customCheck1').prop('checked') ? "1" : "0", $('#windSpeed').val(), $('#precipitation').val());
  initGui(predictDataSet);
  $("#uploadPanel").show();
  $("#predictPanel").hide();
  $("#goPredict").html("Predict Mode - " + "Windspeed:" + $('#windSpeed').val() + " Precipitation:" + $('#precipitation').val() + " Gameday: " + ($('#customCheck1').prop('checked') ? "Yes" : "No"));

}

function initGui(resultData) {

  $('#grid').show();
  dataSet = resultData;
  gridDataTable = $('#dataSetTable').DataTable({

    data: resultData, //results.data,
    columns: [
      //time,pedestrians,bicyclists,cars,buses,trucks,location
      {
        data: 'time'
      },
      {
        data: 'location'
      },
      {
        data: 'pedestrians'
      },
      {
        data: 'bicyclists'
      },
      {
        data: 'cars'
      },
      {
        data: 'buses'
      },
      {
        data: 'trucks'
      },
    ]
  });
  $('#currentDataSetName').text(currentDateSetName);
  $('#currentFileName').text("Choose dataset file..");
  $('.custom-file').hide();
  $('#btnUpload').hide();
  $('#btnReset').show();
  $('#vis').show();
  $('html, body').animate({
    scrollTop: ($('#gui').offset().top)
  }, 500);

  dataSet.forEach(function (item, index) {
    locArr.push(item.location);
    dateArr.push(item.time.toLocaleDateString());
    timeArr.push(item.time.toTimeString().split(' ')[0].substr(0, 5));
  });

  locArr = locArr.filter(onlyUnique);
  dateArr = dateArr.filter(onlyUnique);
  dateArr.sort();
  timeArr = timeArr.filter(onlyUnique);
  timeArr.sort();
  $("#timeLineRange").attr("max", timeArr.length - 1);
  ///////////datepicker 

  $('#datepicker').datepicker({
    uiLibrary: 'bootstrap4',
    // iconsLibrary: 'fontawesome',
    // icons:{ rightIcon: '<i class="far fa-calendar">icon</i>'
    // },
    showOnFocus: true,
    showRightIcon: false,
    value: dateArr[0],
    disableDates: function (date) {
      if (dateArr.indexOf(date.toLocaleDateString()) == -1) {
        return false;
      } else {
        return true;
      }
    }
  });


  //dateArr.forEach();
  locArr.forEach(function (item, index) {
    $('#inputLoc').append(new Option(item, item));
  });
  timeArr.forEach(function (item, index) {
    $('#inputTime').append(new Option(item, item));
  });
  drawPlot($('#datepicker').val(), $("#inputLoc").val());

  $("#datepicker").change(function () {

    drawPlot($('#datepicker').val(), $("#inputLoc").val());
    $("#timeLineRange").trigger("change");
  });
  $("#inputLoc").change(function () {

    drawPlot($('#datepicker').val(), $("#inputLoc").val());
    $("#timeLineRange").trigger("change");

  });
  $("#timeLineRange").change(function () {
    if (timeArr[$("#timeLineRange").val()] !== $("#inputTime").val()) {
      $("#inputTime").val(timeArr[$("#timeLineRange").val()]);
    }
    config.guideLine[0].start = [$("#inputTime").val(), 0];
    config.guideLine[0].end = [$("#inputTime").val(), findPeakVal($('#datepicker').val(), $("#inputLoc").val(), $("#inputTime").val())];
    plot.updateConfig(config);
    plot.render();
    initPath();



  });
  $("#inputTime").change(function () {
    if (timeArr[$("#timeLineRange").val()] !== $("#inputTime").val()) {
      //$("#inputTime").val(timeArr[$("#timeLineRange" ).val()]);
      $("#timeLineRange").val(timeArr.findIndex(function (item) {
        return $("#inputTime").val() == item;
      }));
    }
  });
  $("#timeLineRange").trigger("change");
  initMap();
}



function findPeakVal(day, loc, time) {
  var peakVal = 0;
  dataSet.forEach(function (item, index) {
    if (item.time.toLocaleDateString() == day && loc == item.location && item.time.toTimeString().split(' ')[0].substr(0, 5) == time) {
      peakVal = [item.pedestrians, item.buses, item.cars, item.trucks, item.bicyclists].sort(function (a, b) {
        return a - b
      }).reverse()[0];

    }

  });

  return peakVal;
}


function drawPlot(day, loc) {
  day[3] == "0" ? day = day.substr(0, 3) + day.substr(4) : day = day;



  container = document.getElementById('app');

  readPlotData(day, loc);

  if (currentMode == 2) {
    config = {
      "title": {
        "visible": true,
        "text": day + ", " + loc
      },
      "description": {
        "text": ""
      },
      "legend": {
        "flipPage": false
      },
      "xAxis": {
        "autoHideLabel": true
      },
      "smooth": true,
      "width": 800,
      "height": 382,
      "xField": "x",
      "yField": "y",
      "seriesField": "series",
      "color": function (s) {
        return getColor(s);
      },
      //["#269a99","#6dc8ec","#e8684a","#ff99c3","#5d7092"],
      "guideLine": [{
        "start": [$("#inputTime").val(), 0],
        "end": [$("#inputTime").val(), 0],
        "lineStyle": {
          "stroke": "#FFFFFF",
          "lineWidth": "2",
          "lineDash": [1, 0, 5]
        },
        "text": {},
      }, ],
      "theme": 'dark'
      
    }
  } else {
    config = {
      "title": {
        "visible": true,
        "text": day + ", " + loc
      },
      "description": {
        "text": ""
      },
      "legend": {
        "flipPage": false
      },
      "xAxis": {
        "autoHideLabel": true
      },
      "smooth": true,
      "width": 800,
      "height": 382,
      "xField": "x",
      "yField": "y",
      "seriesField": "series",
      "color": function (s) {
        return getColor(s);
      },
      //["#269a99","#6dc8ec","#e8684a","#ff99c3","#5d7092"],
      "guideLine": [{
        "start": [$("#inputTime").val(), 0],
        "end": [$("#inputTime").val(), 0],
        "lineStyle": {
          "stroke": "#242a38",
          "lineWidth": "2",
          "lineDash": [1, 0, 5]
        },
        "text": {},
      }, ],

    }

  };

  if (typeof plot !== 'undefined') {
    //plot.destroy();
    plot.changeData(plotData);
    plot.updateConfig(config);
    plot.render();
  } else {

    plot = new G2Plot.Line(container, {
      data: plotData,
      ...config,

    });

    plot.render();
  }
}

function getColor(t) {

  switch (t) {
    case "cars":
      color = "#ff99c3";
      break;
    case "buses":
      color = "#5d7092";
      break;
    case "pedestrians":
      color = "#269a99";
      break;
    case "bicyclists":
      color = "#6dc8ec";
      break;
    case "trucks":
      color = "#e8684a";
      break;
    default:
      color = '#' + Math.floor(Math.random() * 16777215).toString(16);
  }
  return color;
}


function resetData() {


  //reset gui
  $("#mainWindow").css({background: '#ffffff'});
  $('#goPredict').html("Observe Mode");
  $('input[type="file"]').val("");
  $('#currentDataSetName').text("");
  $('.custom-file').show();
  $('#btnUpload').show();
  $('#btnReset').hide();
  $('#vis').hide();
  $('#grid').hide();
  $('html, body').animate({
    scrollTop: ($('#nav').offset().top)
  }, 500);
  var plotData = [];
  var flowData = [];
  var locArr = [];
  var dateArr = [];
  var timeArr = [];
  gridDataTable.destroy();

}







/////////////mapbox init

function initMap() {
  mapboxgl.accessToken = 'pk.eyJ1IjoicXNsMDkxMyIsImEiOiJjazNveDV1Nnkxa2s3M2dxbnkwZ2wxYXFzIn0.CTJBnrFv6d1HdotUk8t7uQ';
map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/qsl0913/ck72bt4px0ddt1itebbwss8em'
});

  if (currentMode == 2) {
    scene = new L7.Scene({
      id: 'map',
      map: new L7.Mapbox({
        //center: [ -74.006, 40.7128 ],
        center: [-76.938, 38.992],
        zoom: 13,
        style: 'dark'
      })
    });
  } else {
    scene = new L7.Scene({
      id: 'map',
      map: new L7.Mapbox({
        //center: [ -74.006, 40.7128 ],
        center: [-76.938, 38.992],
        zoom: 13
      })
    });
  }

  zoomControl = new L7.Zoom({
    position: 'bottomright',
  });

  scene.addControl(zoomControl);

  $.get('./data/loc.csv', function (data) {

    bubble = new L7.PointLayer({
        zIndex: 15,
        offsets: [5, 5]
      })
      .source(data, {
        parser: {
          type: 'csv',
          x: 'x',
          y: 'y'
        },
      })
      .shape('circle')
      .size(10)
      .color('grey')
      .style({
        opacity: 0.3,
        strokeWidth: 1,
      });
    scene.addLayer(bubble);

  });
};

function findCurrVal(day, loc,fmode, time) {
  var cVal = 0;
  dataSet.forEach(function (item, index) {
    if (item.time.toLocaleDateString() == day && loc == item.location && item.time.toTimeString().split(' ')[0].substr(0, 5) == time) { 
        if (fmode=="cars"){ cVal= item.cars; }
        if (fmode=="pedestrians"){cVal= item.pedestrians;  }

    }

  });

  return cVal;
}

function initPath() {

  if (typeof lineLayer1!=='undefined'){
  scene.removeLayer(lineLayer1);
  scene.removeLayer(lineLayer2);
  scene.removeLayer(lineLayer3);
  scene.removeLayer(lineLayer4);
  scene.removeLayer(lineLayer5);
  scene.removeLayer(lineLayer6);
  scene.removeLayer(lineLayer7);
  scene.removeLayer(lineLayer8);
  scene.removeLayer(lineLayer9);
  scene.removeLayer(lineLayer10);}

//////////////draw path  
$.get('./data/path.json', function (data) {
  //lineLayer1
  var dataSet0 = data[0];
  var dataSet1 = data[1];
  var dataSet2 = data[2];
  var dataSet3 = data[3];
  var dataSet4 = data[4];

  //////////////loc1
  //////////////
  //////////////
  lineLayer1 = new L7.LineLayer({
      visible: true,
      blend: "normal"
    })
    .source(dataSet0, {
      parser: {
        type: 'json',
        coordinates: 'path'
      }
    })
    .size([3, 0])
    .shape('line')
    .color('color', v => {
      return getColor('cars');
    })
    .animate({
      interval: Math.floor(100/findCurrVal($('#datepicker').val(), "Campus_Dr_&_Presidential_Ave","cars", $("#inputTime").val())/1) , //0-1
      trailLength: 0.5, //0-1
      duration: 1 //seconds
    });
  //lineLayer2
  lineLayer2 = new L7.LineLayer({
      visible: true,
      blend: "normal"
    })
    .source(dataSet0, {
      parser: {
        type: 'json',
        coordinates: 'path'
      }
    })
    .size([1.5, 6])
    .shape('line')
    .color('color', v => {
      return getColor('pedestrians');
    })
    .animate({
      interval: Math.floor(100/findCurrVal($('#datepicker').val(), "Campus_Dr_&_Presidential_Ave","pedestrians", $("#inputTime").val())/1) ,//0-1
      trailLength: 0.5,
      duration: 1
    });


    //////////////loc2
  //////////////
  //////////////
  lineLayer3 = new L7.LineLayer({
    visible: true,
    blend: "normal"
  })
  .source(dataSet1, {
    parser: {
      type: 'json',
      coordinates: 'path'
    }
  })
  .size([3, 0])
  .shape('line')
  .color('color', v => {
    return getColor('cars');
  })
  .animate({
    interval: Math.floor(100/findCurrVal($('#datepicker').val(), "Campus_Dr_At_Paint_Branch_Dr","cars", $("#inputTime").val())/1) , //0-1
    trailLength: 0.5, //0-1
    duration: 1 //seconds
  });
//lineLayer2
lineLayer4 = new L7.LineLayer({
    visible: true,
    blend: "normal"
  })
  .source(dataSet1, {
    parser: {
      type: 'json',
      coordinates: 'path'
    }
  })
  .size([1.5, 6])
  .shape('line')
  .color('color', v => {
    return getColor('pedestrians');
  })
  .animate({
    interval: Math.floor(100/findCurrVal($('#datepicker').val(), "Campus_Dr_At_Paint_Branch_Dr","pedestrians", $("#inputTime").val())/1) ,//0-1
    trailLength: 0.5,
    duration: 1
  });


  //////////////loc3
  //////////////
  //////////////
  lineLayer5 = new L7.LineLayer({
    visible: true,
    blend: "normal"
  })
  .source(dataSet2, {
    parser: {
      type: 'json',
      coordinates: 'path'
    }
  })
  .size([3, 0])
  .shape('line')
  .color('color', v => {
    return getColor('cars');
  })
  .animate({
    interval: Math.floor(100/findCurrVal($('#datepicker').val(), "University_Blvd_&_Paint_Branch_Dr","cars", $("#inputTime").val())/1) , //0-1
    trailLength: 0.5, //0-1
    duration: 1 //seconds
  });
//lineLayer2
lineLayer6 = new L7.LineLayer({
    visible: true,
    blend: "normal"
  })
  .source(dataSet2, {
    parser: {
      type: 'json',
      coordinates: 'path'
    }
  })
  .size([1.5, 6])
  .shape('line')
  .color('color', v => {
    return getColor('pedestrians');
  })
  .animate({
    interval: Math.floor(100/findCurrVal($('#datepicker').val(), "University_Blvd_&_Paint_Branch_Dr","pedestrians", $("#inputTime").val())/1) ,//0-1
    trailLength: 0.5,
    duration: 1
  });


  //////////////loc4
  //////////////
  //////////////
  lineLayer7 = new L7.LineLayer({
    visible: true,
    blend: "normal"
  })
  .source(dataSet3, {
    parser: {
      type: 'json',
      coordinates: 'path'
    }
  })
  .size([3, 0])
  .shape('line')
  .color('color', v => {
    return getColor('cars');
  })
  .animate({
    interval: Math.floor(100/findCurrVal($('#datepicker').val(), "Regents_Dr_&_Stadium_Dr_2","cars", $("#inputTime").val())/1) , //0-1
    trailLength: 0.5, //0-1
    duration: 1 //seconds
  });
//lineLayer2
lineLayer8 = new L7.LineLayer({
    visible: true,
    blend: "normal"
  })
  .source(dataSet3, {
    parser: {
      type: 'json',
      coordinates: 'path'
    }
  })
  .size([1.5, 6])
  .shape('line')
  .color('color', v => {
    return getColor('pedestrians');
  })
  .animate({
    interval: Math.floor(100/findCurrVal($('#datepicker').val(), "Regents_Dr_&_Stadium_Dr_2","pedestrians", $("#inputTime").val())/1) ,//0-1
    trailLength: 0.5,
    duration: 1
  });


  //////////////loc5
  //////////////
  //////////////
  lineLayer9 = new L7.LineLayer({
    visible: true,
    blend: "normal"
  })
  .source(dataSet4, {
    parser: {
      type: 'json',
      coordinates: 'path'
    }
  })
  .size([3, 0])
  .shape('line')
  .color('color', v => {
    return getColor('cars');
  })
  .animate({
    interval: Math.floor(100/findCurrVal($('#datepicker').val(), "South_Gate_Northern_View","cars", $("#inputTime").val())/1) , //0-1
    trailLength: 0.5, //0-1
    duration: 1 //seconds
  });
//lineLayer2
lineLayer10 = new L7.LineLayer({
    visible: true,
    blend: "normal"
  })
  .source(dataSet4, {
    parser: {
      type: 'json',
      coordinates: 'path'
    }
  })
  .size([1.5, 6])
  .shape('line')
  .color('color', v => {
    return getColor('pedestrians');
  })
  .animate({
    interval: Math.floor(100/findCurrVal($('#datepicker').val(), "South_Gate_Northern_View","pedestrians", $("#inputTime").val())/1) ,//0-1
    trailLength: 0.5,
    duration: 1
  });
 


  scene.addLayer(lineLayer1);
  scene.addLayer(lineLayer2);
  scene.addLayer(lineLayer3);
  scene.addLayer(lineLayer4);
  scene.addLayer(lineLayer5);
  scene.addLayer(lineLayer6);
  scene.addLayer(lineLayer7);
  scene.addLayer(lineLayer8);
  scene.addLayer(lineLayer9);
  scene.addLayer(lineLayer10);



});
}