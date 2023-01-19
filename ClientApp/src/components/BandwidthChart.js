import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

function BandwidthChart(props) {

    const chartContainer = useRef(null);
    const [chartInstance, setChartInstance] = useState(null);

    useEffect(() => {
        if (chartContainer && chartContainer.current) {
            const newChartInstance = new Chart(chartContainer.current, config);
            setChartInstance(newChartInstance);
        }
    }, [chartContainer]);

    const datapoints = useRef([]);

    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    const chartWidth = 500;

    const labels = useRef([]);

    for (let i = 0; i < chartWidth; ++i) {
        labels.current.push(i.toString());
        datapoints.current.push(getRandomInt(3000).toString());
    }

    const data = {
        labels: labels.current,
        datasets: [
            {
                label: '192.168.1.1 - 192.168.1.2',
                data: datapoints.current,
                borderColor: 'rgb(0, 220, 255)',
                fill: {
                    target: 'origin',
                    above: 'rgb(180, 230, 255)'
                },
                cubicInterpolationMode: 'monotone',
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
        type: 'line',
        data: data,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Chart.js Line Chart - Cubic interpolation mode'
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
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Mbps'
                    },
                    suggestedMin: 0,
                    suggestedMax: 400
                }
            }
        },
    };

    return (
        <div>
            <canvas style={{ height: '5px' }} ref={chartContainer} />
        </div>
    );
}

export default BandwidthChart;