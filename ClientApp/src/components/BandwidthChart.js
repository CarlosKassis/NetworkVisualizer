import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-moment';

Chart.register(...registerables);

function BandwidthChart(props) {

    const chartContainer = useRef(null);
    const chartInstance = useRef(null);

    const data = {
        labels: [1, 2],
        datasets: [
            {
                label: '',
                data: ["2", "4"],
                //borderColor: 'rgb(0, 220, 255)',
                backgroundColor: 'rgb(0, 220, 255)',
                //fill: {
                //    target: 'origin',
                //    above: 'rgb(180, 230, 255)'
                //},
                tension: 0.1
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
            plugins: {
                title: {
                    display: true,
                    text: 'Traffic between entities'
                },
            },
            interaction: {
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true
                    },
                    type: 'time'
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
            chartInstance.current.data.labels.push(props.chartData[i][0]);
            chartInstance.current.data.datasets[0].data.push(props.chartData[i][1]);
        }

        chartInstance.current.data.datasets[0].label = `${props.entity1} - ${props.entity2}`;

        chartInstance.current.update('none');
    }, [props.chartData]);

    return (
        <div style={{ width:'500px', height:'500px' }}>
            <canvas style={{ height: '5px' }} ref={chartContainer} />
        </div>
    );
}

export default BandwidthChart;