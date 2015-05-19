d3.layout.customPie = function() {
    var value = Number, startAngle = 0, endAngle = 2 * Math.PI;
    function pie(data) {
        var a = +(typeof startAngle === "function" ? startAngle.apply(this, arguments) : startAngle);
        var k = ((typeof endAngle === "function" ? endAngle.apply(this, arguments) : endAngle) - a) / 100;

      var arcs = [];
       arcs[0] = {
          data: data.value,
          value: d = data.value,
          key:data.key,
          startAngle: a,
          endAngle: a += d * k
        };
      return arcs;
    }
    pie.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return pie;
    };
    pie.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return pie;
    };
    pie.startAngle = function(x) {
      if (!arguments.length) return startAngle;
      startAngle = x;
      return pie;
    };
    pie.endAngle = function(x) {
      if (!arguments.length) return endAngle;
      endAngle = x;
      return pie;
    };
    return pie;
  };