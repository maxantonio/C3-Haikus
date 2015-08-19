//configuracion de este estilo de grafica
var parseDate = d3.time.format(formato).parse;
var formatDate = d3.time.format(formato);
var charts = [];//contenedor de graficos para usar en showTooltip
var gsubchart = null;
var obj_stookTools = null;
var bisect = d3.bisector(function (d) {
    return parseDate(d);
}).left;

//Dice si actualmente se esta comparando o no
var comparando = false;

//datos_aleatorios(total_datos);
console.log(periodos);


//Genera datos aleatorios a partir de la fecha actual hacia atras



function InitData(){
    obj_stookTools = new StockTools("#chart-header", periodos);
    var chart2 = c3.generate({
        bindto: '#chart2',
        bar:{
            width:5
        },
        data: datos_volumen,
        padding:{
            left:50
        },
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
            show: false
        },
        onmouseout: function () {
            charts[0].tooltip.hide();
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
            show: true,
            onbrush: function (d) {
                m_aux_Update(obj_stookTools, d[0], d[1]);
            }
        }
    });
    var chart = c3.generate({
        data: datos,
        zoom:{
            rescale:true
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
        onmouseout: function () {
            chart2.tooltip.hide();
        }
    });
    charts.push(chart);
    charts.push(chart2);
    charts.push(chart3);
//sobreescribiendo el metodo tooltip.show para evitar la propagacion del mouseover
    charts[1].tooltip.show = function (args) {
        var ds = charts[1].internal, index, mouse;
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
//Quita los datos correspondientes de esta grafica
    charts[0].unload({
        ids: ['IPC', 'YAHOO']
    });

}

//reajustando posicion cuando se redimenciona la ventana
window.addEventListener('resize',win_resize);
function win_resize(){
    var z = charts[0].zoom();
    var ticks = m_generateTicks(z[0], z[1]);
    var ticks2 = m_generateTicks(new Date(fechaInicio),new Date(fechaFin));
    console.log(ticks);
    console.log("ticks");
    //cambiando los tickValues y dando zoom para el 1er Grafico
    charts[0].internal.config.axis_x_tick_values = ticks;
    charts[1].internal.config.axis_x_tick_values = ticks;
    charts[2].internal.config.axis_x_tick_values = ticks2;
    charts[2].internal.redraw();

    //desapareciendo la grafica para trabajar solo con el subchart
    var shchart3 = d3.selectAll('#chart3');
    var svg3 = shchart3.select('svg');
    var gs = svg3.select('g');

    gsubchart = svg3.select('.subchart_haikus');
    gs.style('display', 'none');
    if(gsubchart){
        console.log("si hay subchart");
        console.log(gsubchart)
        setTimeout(function() {
            console.log("ejecutado");
            gsubchart.attr("transform", 'translate(50.5,0.4)');
        }, 500);

    }
    console.log("RESIZE APLICADO")
}

//para  mostrar tooltip
function showTooltip(indexChart, event, d) {

    charts[indexChart].tooltip.show({
        mouse: [event.pageX, 50],
        data: d
    });
}

function mostrar_periodo_seleccionado() {
    var fechaInicio = parseDate(document.getElementById("inicio").value);
    var fechaFin = parseDate(document.getElementById("fin").value);
    m_updateGrafica(fechaInicio, fechaFin);
}

function mensaje(cant){
    InitData(datos_aleatorios(cant));
    console.log("generado "+cant+" elementos");
}
//InitData(datos_aleatorios(total_datos));
