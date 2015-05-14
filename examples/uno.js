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
    var fechas2 = ["x"];
    var maxcom = ["MAXCOM"];
    var volume_maxcom = ["MAXCOM"];
    var ipc = ["IPC"];
    var yahoo = ["YAHOO"];

    var fecha = new Date();
    fecha.setDate(fecha.getDate() - cant);

    for (var i = 1; i <= cant; i++) {
        fecha.setDate(fecha.getDate() + 1);
        fechas.push(formatDate(fecha));
        fechas2.push(formatDate(fecha));
        maxcom.push(Math.floor((Math.random() * 850) + 345));
        volume_maxcom.push(Math.floor((Math.random() * 3000) + 1000));
        ipc.push(Math.floor((Math.random() * 650) + 140));
        yahoo.push(Math.floor((Math.random() * 780) + 354));
    }

    datos.columns = [fechas, maxcom, ipc, yahoo];
    datos_volumen.columns = [fechas2, volume_maxcom];
}


//Analizar esto porque se forma un ciclo infinito
datos_volumen.onmouseover = function (d) {
    //chart.tooltip.show({
    //    mouse: [d3.event.pageX, 50],
    //    data: d
    //});
    console.info("Grafica del volumen");
};


//Cuando se mueve el mouse por la grafica de linea
datos.onmouseover = function (d) {
    chart2.tooltip.show({
        mouse: [d3.event.pageX, 50],
        data: d
    });
    console.info('Grafica de linea');
};

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
            }, height: 20
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
    tooltip: {
        format: {
            title: function (d) {
                return "Volumen"
            },
            value: function (value, ratio, id) {
                return d3.format('s')(value);
            }
        }
    }
});


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
    zoom: {
        enabled: false
    },
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
    },
    interaction: {
        enabled: true
    }
});

//Quita los datos correspondientes de esta grafica
chart.unload({
    ids: ['IPC', 'YAHOO']
});
