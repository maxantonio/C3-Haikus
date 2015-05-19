//configuracion de este estilo de grafica
var parseDate = d3.time.format(formato).parse;
var formatDate = d3.time.format(formato);
var bisect = d3.bisector(function (d) {
    return parseDate(d);
}).left;

//Dice si actualmente se esta comparando o no
var comparando = false;

datos_aleatorios(total_datos);
var p = new StockTools("#chart-header", periodos);

//Genera datos aleatorios a partir de la fecha actual hacia atras
function datos_aleatorios(cant) {
    var fechas = ["x"];
    var maxcom = ["MAXCOM"];
    var volume_maxcom = ["MAXCOM"];
    var ipc = ["IPC"];
    var yahoo = ["YAHOO"];

    var fecha = new Date();
    fecha.setDate(fecha.getDate() - cant);

    for (var i = 1; i <= cant; i++) {
        fecha.setDate(fecha.getDate() + 1);
        fechas.push(formatDate(fecha));
        maxcom.push(Math.floor((Math.random() * 850) + 345));
        volume_maxcom.push(Math.floor((Math.random() * 3000) + 1000));
        ipc.push(Math.floor((Math.random() * 650) + 140));
        yahoo.push(Math.floor((Math.random() * 780) + 354));
    }

    datos.columns = [fechas, maxcom, ipc, yahoo];
    datos_volumen.columns = [fechas, volume_maxcom];
    datos_area.columns = [fechas, maxcom];
}

//Cuando se mueve el mouse por la grafica de linea
datos.onmouseover = function (d) {
    showTooltip(1, d3.event, d)
}
//Cuando se mueve el mouse por la grafica de volumen
datos_volumen.onmouseover = function (d) {
    showTooltip(0, d3.event, d)
}

var charts = new Array();//contenedor de graficos para usar en showTooltip
var chart2 = c3.generate({
    bindto: '#chart2',
    data: datos_volumen,
    size: {
        height: 100
    },
    axis: {
        x: {
            type: 'timeseries',
            tick: {
                format: formato
            }
        },
        y: {
            tick: {
                count: 4,
                format: function (value) {
                    var b = d3.format('f')(value);
                    if (b == 0)
                        return 0;
                    return d3.format('s')(b);
                }
            }
        }
    },
    grid: {
        x: {show: true}
    },
    legend: {
        show: false
    },
    tooltip: {
        format: {
            title: function (d) {
                return "Volumen"
            },
            value: function (value, ratio, id) {
                return d3.format('s')(value);
            }
        }
    },
    subchart: {
        show:false
    }

});
var chart3 = c3.generate({
    bindto: "#chart3",
    size: {
        height: 200
    },
    data: datos_area,
    axis: {
        x: {
            type: 'timeseries',
            tick: {
                format: formato
            }
        },
        y: {
            tick: {
                count: 1,
                format: function (value) {
                    var b = d3.format('f')(value);
                    if (b == 0)
                        return 0;
                    return d3.format('s')(b);
                }
            }
        }
    },
    point: {
        show: true
    },
    legend: {
        show: false
    },
    tooltip: {
        show: false
    },
    interaction: {
        enabled: false
    },
    subchart: {
        show:true,
        onbrush: function (d) {
            chart.zoom(d);
            chart2.zoom(d);

        }
    }

});

//sobreescribiendo el metodo tooltip.show para evitar la propagacion del mouseover
chart2.tooltip.show = function (args) {
    var ds = chart2.internal, index, mouse;

    // determine mouse position on the chart
    if (args.mouse) {
        mouse = args.mouse;
    }

    // determine focus data
    if (args.data) {
        if (ds.isMultipleX()) {
            // if multiple xs, target point will be determined by mouse
            mouse = [ds.x(args.data.x), ds.getYScale(args.data.id)(args.data.value)];
            index = null;
        } else {
            // TODO: when tooltip_grouped = false
            index = ds.isValue(args.data.index) ? args.data.index : ds.getIndexByX(args.data.x);
        }
    }
    else if (typeof args.x !== 'undefined') {
        index = this.getIndexByX(args.x);
    }
    else if (typeof args.index !== 'undefined') {
        index = args.index;
    }

    // emulate mouse events to show
    //  $$.dispatchEvent('mouseover', index, mouse);
    ds.dispatchEvent('mousemove', index, mouse);
}

var chart = c3.generate({
    data: datos,
    axis: {
        x: {
            type: 'timeseries',
            tick: {
                format: formato
            }
        },
        y: {
            tick: {
                format: function (value) {
                    //console.info(value);
                    if (d3.format(",.2f")(value) == '-0.00')
                        return "0%";
                    if (value != 0)
                        return comparando ? d3.format(",.2f")(value) + "%" : d3.format('s')(value);
                    return value + "%";
                }
            }
        }
    },
   /* zoom: {
        enabled: false
    },*/
    grid: {
        x: {
            show: true
        },
        y: {
            show: true
        }
    },
    tooltip: {
        format: {
            title: function (d) {
                return d3.time.format("%a %d %b, %Y")(d)
            },
            value: function (value, ratio, id) {
                return comparando ? value + "%" : d3.format(',')(value);
            }
        }
    }
});
charts.push(chart);
charts.push(chart2);
//Quita los datos correspondientes de esta grafica
chart.unload({
    ids: ['IPC', 'YAHOO']
});

var shchart3 = d3.selectAll('#chart3');
var svg3 =shchart3.select('svg');

//desapareciendo la grafica para trabajar solo con el subchart
var gs = svg3.select('g');
var gsubchart = svg3.select('.subchart_haikus');
gs.style('display','none');
gsubchart.attr("transform", 'translate(50.5,0.5)');

//para  mostrar tooltip
function showTooltip(indexChart, event, d) {
    //console.log(charts[indexChart])
    charts[indexChart].tooltip.show({
        mouse: [event.pageX, 50],
        data: d
    });
}

