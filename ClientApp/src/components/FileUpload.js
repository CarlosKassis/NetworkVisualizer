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
            xhr.open('GET', 'networkanalyzer/offline');

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
            <input type="file" onChange={(e) => setUploadedfile(e.target.files[0])} multiple={false} />
            <button className={"btn-cyber"} onClick={handleFileUpload}>Upload</button>
        </div>
    );
}

export default FileUploadSingle;