function drawRadar(data, id){
    google.charts.load('upcoming', {
      'packages': ['vegachart']
    }).then(loadCharts);

    console.log(data);

    // dataArr = []
    // for(var feat in data){
    //     if(feat=='acousticness' || feat=='danceability' || feat=='energy' || feat=='instrumentalness' 
    //         || feat=='liveness' || feat=='speechiness' || feat=='valence'){
    //         dataArr.push([feat, data[feat],'']);
    //     }
    // }
    const dataArr = [
        ['valence',data['valence'],''],
        ['acousticness',data['acousticness'],''],
        ['danceability',data['danceability'],''],
        ['energy',data['energy'],''],
        ['instrumentalness',data['instrumentalness'],''],
        // ['liveness',data['liveness'],''],
        ['speechiness',data['speechiness'],'']
    ]

    function loadCharts() {
      addChart('', dataArr, "#FFB588E6", id);
    };

    function addChart(title, data, color, id) {
      const dataTable = new google.visualization.DataTable();
      dataTable.addColumn({
        type: 'string',
        'id': 'key'
      });
      dataTable.addColumn({
        type: 'number',
        'id': 'value'
      });
      dataTable.addColumn({
        type: 'string',
        'id': 'category'
      });
      dataTable.addRows(data);

      var strokewidth = 1.4;
      var strokecolor = '#ffffffcc';
      const options = {
        'vega': {
          "$schema": "https://vega.github.io/schema/vega/v5.json",
          "width": 350,
          "height":315,
          "autosize": "none",
          "title": {
            "text": title,
            "anchor": "middle",
            "fontSize": 14,
            "dy": -8,
            "dx": {
              "signal": "-width/4"
            },
            // "subtitle": "RDI per 100g"
          },
          "signals": [{
            "name": "radius",
            "update": "90"
          }],
          "data": [{
              "name": "table",
              "source": "datatable",
            },
            {
              "name": "keys",
              "source": "table",
              "transform": [{
                "type": "aggregate",
                "groupby": ["key"]
              }]
            }
          ],
          "scales": [{
              "name": "angular",
              "type": "point",
              "range": {
                "signal": "[-PI, PI]"
              },
              "padding": 0.5,
              "domain": {
                "data": "table",
                "field": "key"
              }
            },
            {
              "name": "radial",
              "type": "linear",
              "range": {
                "signal": "[0, radius]"
              },
              "zero": true,
              "nice": false,
              "domain": [0, 1],
            }
          ],
          "encode": {
            "enter": {
              "x": {
                "signal": "width/2"
              },
              "y": {
                "signal": "height/2 + 20"
              }
            }
          },
          "marks": [{
              "type": "group",
              "name": "categories",
              "zindex": 1,
              "from": {
                "facet": {
                  "data": "table",
                  "name": "facet",
                  "groupby": ["category"]
                }
              },
              "marks": [{
                  "type": "line",
                  "name": "category-line",
                  "from": {
                    "data": "facet"
                  },
                  "encode": {
                    "enter": {
                      "interpolate": {
                        "value": "linear-closed"
                      },
                      "x": {
                        "signal": "scale('radial', datum.value) * cos(scale('angular', datum.key))"
                      },
                      "y": {
                        "signal": "scale('radial', datum.value) * sin(scale('angular', datum.key))"
                      },
                      "stroke": {
                        "value": color
                      },
                      "strokeWidth": {
                        "value": 2
                      },
                      "fill": {
                        "value": color
                      },
                      "fillOpacity": {
                        "value": 0.4
                      }
                    }
                  }
                },
                {
                  "type": "text",
                  "name": "value-text",
                  "from": {
                    "data": "category-line"
                  },
                  "encode": {
                    "enter": {
                      "x": {
                        "signal": "datum.x + 14 * cos(scale('angular', datum.datum.key))"
                      },
                      "y": {
                        "signal": "datum.y + 14 * sin(scale('angular', datum.datum.key))"
                      },
                      "text": {
                        "signal": "format(datum.datum.value,'.1%')"
                      },
                      "opacity": {
                        "signal": "datum.datum.value > 0.01 ? 1 : 0"
                      },
                      "align": {
                        "value": "center"
                      },
                      "baseline": {
                        "value": "middle"
                      },
                      "fontWeight": {
                        "value": "bold"
                      },
                      "fill": {
                        "value": '#ffffff00'
                      },
                    }
                  }
                }
              ]
            },
            {
              "type": "rule",
              "name": "radial-grid",
              "from": {
                "data": "keys"
              },
              "zindex": 0,
              "encode": {
                "enter": {
                  "x": {
                    "value": 0
                  },
                  "y": {
                    "value": 0
                  },
                  "x2": {
                    "signal": "radius * cos(scale('angular', datum.key))"
                  },
                  "y2": {
                    "signal": "radius * sin(scale('angular', datum.key))"
                  },
                  "stroke": {
                    "value": strokecolor
                  },
                  "strokeWidth": {
                    "value": strokewidth
                  }
                }
              }
            },
            {
              "type": "text",
              "name": "key-label",
              "from": {
                "data": "keys"
              },
              "zindex": 1,
              "encode": {
                "enter": {
                  "x": {
                    "signal": "(radius + 11) * cos(scale('angular', datum.key))"
                  },
                  "y": [{
                      "test": "sin(scale('angular', datum.key)) > 0",
                      "signal": "5 + (radius + 11) * sin(scale('angular', datum.key))"
                    },
                    {
                      "test": "sin(scale('angular', datum.key)) < 0",
                      "signal": "-5 + (radius + 11) * sin(scale('angular', datum.key))"
                    },
                    {
                      "signal": "(radius + 11) * sin(scale('angular', datum.key))"
                    }
                  ],
                  "text": {
                    "field": "key"
                  },
                  "align": {
                    "value": "center"
                  },
                  "baseline": [{
                      "test": "scale('angular', datum.key) > 0",
                      "value": "top"
                    },
                    {
                      "test": "scale('angular', datum.key) == 0",
                      "value": "middle"
                    },
                    {
                      "value": "bottom"
                    }
                  ],
                  "fill": {
                    "value": "#fff"
                  },
                  "fontSize": {
                    "value": 15
                  },
                  "font":{"value": "Segoe Script"},
                }
              }
            },
            {
              "type": "line",
              "name": "twenty-line",
              "from": {
                "data": "keys"
              },
              "encode": {
                "enter": {
                  "interpolate": {
                    "value": "linear-closed"
                  },
                  "x": {
                    "signal": "0.25 * radius * cos(scale('angular', datum.key))"
                  },
                  "y": {
                    "signal": "0.25 * radius * sin(scale('angular', datum.key))"
                  },
                  "stroke": {
                    "value": strokecolor
                  },
                  "strokeWidth": {
                    "value": strokewidth
                  }
                }
              }
            },
            {
              "type": "line",
              "name": "fourty-line",
              "from": {
                "data": "keys"
              },
              "encode": {
                "enter": {
                  "interpolate": {
                    "value": "linear-closed"
                  },
                  "x": {
                    "signal": "0.5 * radius * cos(scale('angular', datum.key))"
                  },
                  "y": {
                    "signal": "0.5 * radius * sin(scale('angular', datum.key))"
                  },
                  "stroke": {
                    "value": strokecolor
                  },
                  "strokeWidth": {
                    "value": strokewidth
                  }
                }
              }
            },
            {
              "type": "line",
              "name": "sixty-line",
              "from": {
                "data": "keys"
              },
              "encode": {
                "enter": {
                  "interpolate": {
                    "value": "linear-closed"
                  },
                  "x": {
                    "signal": "0.75 * radius * cos(scale('angular', datum.key))"
                  },
                  "y": {
                    "signal": "0.75 * radius * sin(scale('angular', datum.key))"
                  },
                  "stroke": {
                    "value": strokecolor
                  },
                  "strokeWidth": {
                    "value": strokewidth
                  }
                }
              }
            },
            {
              "type": "line",
              "name": "outer-line",
              "from": {
                "data": "radial-grid"
              },
              "encode": {
                "enter": {
                  "interpolate": {
                    "value": "linear-closed"
                  },
                  "x": {
                    "field": "x2"
                  },
                  "y": {
                    "field": "y2"
                  },
                  "stroke": {
                    "value": strokecolor
                  },
                  "strokeWidth": {
                    "value": strokewidth
                  }
                }
              }
            }
          ]
        }
      };

      const elem = document.createElement("div");
      // elem.setAttribute("style", "display: inline-block; width: 250px; height: 300px; padding: 20px;");

      const chart = new google.visualization.VegaChart(elem);
      chart.draw(dataTable, options);

      document.getElementById(id).appendChild(elem);
    }

}