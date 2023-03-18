import React, { useState } from 'react';
import './Cyber.css'

function FileUploadSingle(props) {

    const [uploadedfile, setUploadedfile] = useState(null);

    const handleFileUpload = async () =>
    {
        try
        {
            if (uploadedfile == null)
            {
                return
            }

            let formData = new FormData();
            formData.append('file', uploadedfile);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'networkanalyzer');

            xhr.onload = () => {
                // TODO: check response status
                props.onCallback(xhr.responseText)
            };

            xhr.send(formData);

        } catch (error) {
            alert(error)
        }
    }

    return (
        <div>
            <button className={"btn-cyber"} onClick={handleFileUpload}>Upload</button>
            <input style={{ marginTop: '0.75vh' }} type="file" onChange={(e) => setUploadedfile(e.target.files[0])} multiple={false} />
        </div>
    );
}

export default FileUploadSingle;