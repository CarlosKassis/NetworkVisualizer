import React, { useEffect, useState } from 'react';
import BandwidthChart from './BandwidthChart';

function InteractionInfo(props) {

    const [chartData, setChartData] = useState([1]);
    const [interaction, setInteraction] = useState(null);

    useEffect(() => {
        setInteraction(props.interaction);
    }, [props.interaction])

    useEffect(() => {
        if (interaction === null) {
            setChartData([[0, 0]]);
            return;
        }

        var newChartData = [];

        const bytesPerSeconds = interaction[0];
        for (const byteCount of bytesPerSeconds) {
            newChartData.push(byteCount);
        }

        setChartData(newChartData);
    }, [interaction])

    return (
        <div>
            {
                interaction === null ? <div /> :
                    <div className={"floating-interaction"}>
                        <button onClick={() => setInteraction(null)}>X</button>
                        <BandwidthChart
                            chartData={chartData}
                            entity1={props.interaction === null ? '' : props.interaction[0][0]}
                            entity2={props.interaction === null ? '' : props.interaction[0][1]}
                        />
                    <h4 style={{ marginTop: '15px' }}><b>Protocols:</b>
                        {
                            (props.interaction === null || props.interaction[3].length == 0) ? '' : (' ' + props.interaction[3].join(", "))
                        }
                    </h4>
                </div>
            }
        </div>
    );
}

export default InteractionInfo;