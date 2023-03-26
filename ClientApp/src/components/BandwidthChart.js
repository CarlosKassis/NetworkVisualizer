import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-moment';

Chart.register(...registerables);

function BandwidthChart(props) {

    const chartContainer = useRef(null);
    const chartInstance = useRef(null);

    const data = {
        labels: [0, 0],
        datasets: [
            {
                label: '',
                data: ["2", "4"],
                borderColor: 'rgb(0, 220, 255)',
                backgroundColor: 'rgb(50, 240, 255)',
                fill: {
                    target: 'origin',
                    above: 'rgb(180, 230, 255)'
                },
                lineTension: 0.1,
                cubicInterpolationMode: 'bezier'
            }
        ]
    };

    const config = {
        type: 'bar',
        data: data,
        options: {  
            maintainAspectRatio: false,
            responsive: true,
            interaction: {
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    type: 'time',
                    time: {
                        unit: 'second'
                    },
                    ticks: {
                        source: 'auto'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Throughput [Bytes/Second]'
                    },
                    suggestedMin: 0,
                    suggestedMax: 5
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function (e) {
                            const time = new Date(e[0].parsed.x).toLocaleString();

                            const bps = e[0].parsed.y;
                            if (bps < 1000) {
                                return `${time} - ${bps} B/s`
                            }
                            if (bps < 1000000) {
                                return `${time} - ${bps/1000} KB/s`
                            }
                            if (bps < 1000000000) {
                                return `${time} - ${bps / 1000000} MB/s`
                            }

                            return `${bps / 1000000000} GB/s`
                        }
                    }
                }
            }
        },
    };

    function tryInitializeChartInstance() {
        if (chartInstance.current == null) {
            if (chartContainer && chartContainer.current) {
                const newChartInstance = new Chart(chartContainer.current, config);
                chartInstance.current = newChartInstance;
            }
        }
    }

    useEffect(() => {
        tryInitializeChartInstance();
    }, [chartContainer])

    useEffect(() => {
        tryInitializeChartInstance();
        if (props.chartData.length == 0) {
            return;
        }

        chartInstance.current.data.labels = [];
        chartInstance.current.data.datasets[0].data = [];

        for (let i = 0; i < props.chartData.length; i++) {
            const point = props.chartData[i];
            if (point[0] == 0) {
                continue;
            }

            chartInstance.current.data.labels.push(point[0] * 1000); // MS to Second
            chartInstance.current.data.datasets[0].data.push(point[1]);
        }

        chartInstance.current.data.datasets[0].label = `Traffic throughput: ${props.entity1} - ${props.entity2}`;

        chartInstance.current.update('none');
    }, [props.chartData]);

    return (
        <div style={{
            height: '300px', padding: '40px', width: '70vh'
        }}>
            <canvas ref={chartContainer} />
        </div>
    );
}

export default BandwidthChart;