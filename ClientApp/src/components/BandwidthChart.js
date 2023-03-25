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
            },
            /*{
                label: 'Cubic interpolation',
                data: datapoints,
                borderColor: 'rgb(255, 0, 0)',
                fill: false,
                tension: 0.4
            }*/
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
                        text: 'Bytes/Second'
                    },
                    suggestedMin: 0,
                    suggestedMax: 5
                }
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        var value = data.datasets[0].data[tooltipItem.index];
                        return value;
                    },
                },
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
            chartInstance.current.data.labels.push(props.chartData[i][0] * 1000);
            chartInstance.current.data.datasets[0].data.push(props.chartData[i][1]);
        }

        chartInstance.current.data.datasets[0].label = `${props.entity1} - ${props.entity2}`;

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